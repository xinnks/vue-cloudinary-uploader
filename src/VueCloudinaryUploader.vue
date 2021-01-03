<template>
  <div id="vue-cloudinary-uploader">
      <input type="hidden" :value="uploadedImageData.secureUrl" :name="inputName">

      <button v-if="uploadedImageData.secureUrl" class="vcu-button button-danger" type="button" @click="deleteImageFromCloud()">Change Image</button>
      <button id="uploader-button" class="vcu-button button-info" type="button" v-else @click.prevent="showModal()" :disabled="processingUpload || modelVisible">Select Image File</button>

    <div id="modal-wrapper" v-show="modelVisible">
      <div class="image-cropper">
        <div class="editor">
          <div class="input">
            <div>
              <input type="file" ref="photo" accept="image/*" @change="addLocalImage()" id="vcu-file-input">
            </div>
          </div>
          <div v-if="showUploadProgress" class="vcu-progress-wrapper">
            <div class="vcu-progress" :style="'width: ' + uploadProgress + '%'"></div>
          </div>
          <div class="img">
            <img ref="working_image" id="image" :src="localFileDataUrl">
          </div>
        </div>
        <div class="options">
          <div>
            <button class="vcu-button button-danger" type="button" @click="destroyUploaderInstance(true)" :disabled="processingUpload">CANCEL</button>
          </div>
          <div>
            <button class="vcu-button button-info" type="button" @click="getImageUrl()" :disabled="processingUpload">CROP</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import axios from 'axios'
  import Cropper from 'cropperjs'
  import 'cropperjs/dist/cropper.css'
  export default {
    name: "CloudinaryVueUploader",
    data(){
      return {
        showFileSelector: true,
        showImageCropper: false,
        showUploadProgress: false,
        modelVisible: false,

        cropperInstance: null,
        uploadProgress: 0,
        processingUpload: false, // this will be true when image is being uploaded to prevent any other upload request
        localFileDataUrl: '',
        cloudinaryUploadUrl: '',
        cloudinaryDeleteUrl: '',
        uploadedImageData: {
          deleteToken: '',
          publicId: '',
          secureUrl: ''
        }
      }
    },
    props: {
      CloudinaryCloudName: {
        type: String,
        default: 'djx5h4cjt',
        validator: (x) => x !== ''
      },
      cloudinaryUploadPreset: {
        type: String,
        default: 'misc-images',
        validator: (x) => x !== ''
      },
      aspectRatio: {
        type: Number,
        default: 0
      },
      inputName: {
        type: String,
        default: 'imageToUpload'
      },
    },
    mounted(){
      this.cloudinaryUploadUrl = `https://api.cloudinary.com/v1_1/${this.CloudinaryCloudName}/upload`
      this.cloudinaryDeleteUrl = `https://api.cloudinary.com/v1_1/${this.CloudinaryCloudName}/delete_by_token`
    },
    methods: {
      showModal(){
        this.modelVisible = true
      },
      hideModal(){
        this.modelVisible = false
      },
      editImage(){
        this.showImageCropper = true
        if(this.cropperInstance){
          this.cropperInstance.destroy()
          this.showImageCropper = false
        }
        this.$nextTick(() => {
          this.cropperInstance = new Cropper(this.$refs.working_image, {
            aspectRatio: this.aspectRatio,
            viewMode: 2,
            background: false,
            crop(event) {},
            ready(){
            this.showImageCropper = true
          }
          });
        })
      },
      async addLocalImage(){
        if(this.$refs.photo.files.length < 1){
          console.log('No photo selected')
          return false
        }
        let photo = this.$refs.photo.files[0];
        this.localFileDataUrl = window.URL.createObjectURL(photo)
        this.$nextTick(this.editImage())
      },
      async getImageUrl(){
        if(!this.cropperInstance){
          alert("Select Image File!")
          return false
        }
        if(!this.cropperInstance.getCroppedCanvas()){
          alert("No Image Detected!")
          return false
        }
        if(this.processingUpload){ // don't initiate another upload while one is running
          alert("Previous upload not completed!")
          return false
        }
        let canvas = this.cropperInstance.getCroppedCanvas()
        await canvas.toBlob( (blob) => {let formData = new FormData()
          formData.append('file', blob)
          formData.append('upload_preset', this.cloudinaryUploadPreset)
          this.uploadImageToCloud(formData)
        })
      },
      destroyUploaderInstance(closeCropper = false){
        // destroy cropper instance
        if(this.cropperInstance && closeCropper){
          this.cropperInstance.destroy()
        }
        // set all other variables to their defaults
        this.cropperInstance = null
        this.localFileDataUrl = ''
        this.processingUpload = false
        this.showFileSelector = true
        this.showImageCropper = false
        this.showUploadProgress = false
        this.uploadProgress = 0
        document.getElementById("vcu-file-input").value = "";
        this.uploadedImageData = { deleteToken: '', publicId: '', secureUrl: '' }
        this.$emit('uploaderDestroyed', "" )
        if(closeCropper){
          this.hideModal()
        }
      },
      uploadImageToCloud(formData){
        this.showUploadProgress = true
        this.processingUpload = true
        this.uploadProgress = 0
        axios.post(this.cloudinaryUploadUrl, formData, {
          onUploadProgress: (progressEvent) => {
            this.uploadProgress = progressEvent.lengthComputable ? Math.round( (progressEvent.loaded * 100) / progressEvent.total ) : 0 ;
          }
        })
        .then( (response) => {
          this.uploadedImageData = {
            secureUrl: response.data.secure_url,
            deleteToken: response.data.delete_token,
            publicId: response.data.public_id
          }
          this.showUploadProgress = false
          this.processingUpload = false
          this.$emit('imageUrl', response.data.secure_url )
          this.hideModal()
        })
        .catch( (error) => {
          if(error.response){
              console.log(error.message)
          }else{
              console.log(error)
          }
          this.showUploadProgress = false
          this.processingUpload = false
        })
      },
      deleteImageFromCloud(){
        if(this.uploadedImageData.deleteToken === ''){ // if delete token is not provided
          console.log("uploadedImageData ", this.uploadedImageData)
          alert("No Delete token")
        }
        let formData = new FormData()
        formData.append('token', this.uploadedImageData.deleteToken)
        axios.post(this.cloudinaryDeleteUrl, formData)
          .then(response => {
            if(this.cropperInstance){
              this.cropperInstance.destroy()
            }
            this.destroyUploaderInstance()
            this.showModal()
            this.$emit('remoteImageDeleted')
          })
          .catch(error=>{
            console.log(error)
            return false
          })
      }
    }
  }
</script>

<style>
  :root{
    --default-font-family: Arial, Helvetica, sans-serif;
    --default-font-weight-small: 300;
    --default-font-weight-medium: 600;
    --default-font-weight-heavy: 900;

    --default-space-x-small: 5px;
    --default-space-small: 10px;
    --default-space-medium: 15px;
    --default-space-large: 25px;
    
    --color-primary: rgb(233,233,239);
    --color-secondary: rgb(248,248,250);
    --color-tertiary: rgb(255,255,255);
    --color-danger: rgb(220, 20, 60);
    --color-danger-dark: rgb(200, 20, 60);
    --color-danger-light: rgb(240, 20, 60);
    --color-info: rgb(13, 125, 216);
    --color-info-dark: rgb(10, 94, 196);
    --color-info-light: rgb(10, 94, 236);
    --color-success: rgb(16, 190, 10);
    --color-success-dark: rgb(16, 170, 10);
    --color-success-light: rgb(16, 210, 10);
    --color-text-button: aliceblue;
  }

  * {
    font-family: var(--default-font-family);
  }

  #vue-cloudinary-uploader{
  }

  .vcu-progress-wrapper{
    height: 30px;
    width: 100%;
    padding: 0;
  }
  .vcu-progress{
    margin: 0;
    height: inherit;
    background: var(--color-success)
  }

/*button styles*/
  .vcu-button{
    position: relative;
    background: var(--color-primary);
    border: none;
    border-radius: 2px;
    color: var(--color-text-button);
    font-weight: 500;
    padding: var(--default-space-small);
    margin-left: 5px;
    cursor: pointer;
  }
  .vcu-button:disabled{
    background: var(--color-primary) !important;
    color: black !important;
  }

  .close-button{
    position: absolute;
    top: 0; right: 0;
    margin: var(--default-space-x-small);
    padding: var(--default-space-small);
    font-weight: var(--default-font-weight-medium);
    cursor: pointer;
    z-index: 5;
  }
  .close-button:hover{
    background-color: var(--color-danger-light);
  }
  .close-button:active{
    background-color: var(--color-danger-dark);
  }

  .button-success{
    background-color: var(--color-success);
  }
  .button-success:hover{
    background-color: var(--color-success-light);
  }
  .button-success:active{
    background-color: var(--color-success-dark);
  }
  .button-danger{
    background-color: var(--color-danger);
  }
  .button-danger:hover{
    background-color: var(--color-danger-light);
  }
  .button-danger:active{
    background-color: var(--color-danger-dark);
  }
  .button-info{
    background-color: var(--color-info);
  }
  .button-info:hover{
    background-color: var(--color-info-light);
  }
  .button-info:active{
    background-color: var(--color-info-dark);
  }

  #modal-wrapper{
    position: fixed;
    top: 10px; bottom: 10px;
    left: 100px; right: 100px;
    border: 1px solid var(--color-primary);
    margin: var(--default-space-small);
    z-index: 99999;
    display: flex;
    box-shadow: 0 0 5px 0 #b1b0b0;
  }

  .image-cropper{
    flex-grow: 1;
    /* padding: var(--default-space-small); */
    display: flex;
    flex-direction: column;
    background-color: var(--color-tertiary);
    max-height: inherit;
    max-width: inherit;
  }

  .image-cropper > .editor{
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    background-color: var(--color-tertiary);
    padding: var(--default-space-small);
    max-height: inherit;
    max-width: inherit;
    overflow: hidden;
  }
  .image-cropper > .editor > .input{
    height: 50px;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
  }
  .image-cropper > .editor > .input{
    height: 50px;
    display: flex;
    flex-direction: row;
    justify-content: center;
  }
  .image-cropper > .editor > div > .input > input, .image-cropper > .editor > .input > button{
    min-height: 20px;
    font-size: 16px;
    margin-left: var(--default-space-small);
  }


  input[type="file"]{
    position: relative !important;
    top: 1% !important;
    z-index: 1 !important;
    width: initial !important;
    height: initial !important;
    -webkit-appearance: initial !important;
    opacity: 1 !important;
    cursor: pointer !important;
  }

  .image-cropper > .editor > .img{
    position: relative;
    max-height: -webkit-fill-available;
    padding: var(--default-space-small);
    flex-grow: 1;
    background: var(--color-tertiary);
    min-height: 20px;
    margin-bottom: 20px;
  }

  .image-cropper > .options{
    display: flex;
    flex-direction: row;
    justify-items: center;
    justify-content: flex-end;
    height: 50px;
    background-color: var(--color-secondary);
    padding: var(--default-space-x-small);
    border-top: 1px solid var(--color-primary);
  }

  .image-cropper > .options > div{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100px;
    padding: var(--default-space-small);
    margin-left: var(--default-space-x-small);
    cursor: pointer;
    font-weight: var(--default-font-weight-small);
  }


  @media screen and (orientation: portrait){
    #modal-wrapper{
      left: 20px; right: 20px;
    }

    .image-cropper > .options{
      height: 10vmin;
    }
  }

  img {
    max-width: 100%;
  }

/*model styes*/
  .show{
    display: flex !important
  }
  .hide{
    display: none !important
  }
</style>
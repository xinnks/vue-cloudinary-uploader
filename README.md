# vue-cloudinary-uploader
A [cloudinary](https://cloudinary.com/) image cropper and uploader component for VueJs

![component at work](https://res.cloudinary.com/djx5h4cjt/image/upload/v1609935316/vue-cloudinary-uploader/clodinary-vcu-preview.gif)

## Props

| Option | Type | Required | Default |
| ------ | ---- | -------- | ------- |
| cloudinaryCloudName | String | true |  |
| cloudinaryUploadPreset | String | true |  |
| aspectRatio | Number | false | 0 |
| inputName | String | false | "imageToUpload" |

### Example

```sh
<vue-cloudinary-uploader
  cloudinary-cloud-name="super_cloud"
  cloudinaryy-preset-name="image_uploads"
  :apect-ratio="1"
  input-name="image_link"
>
</vue-cloudinary-uploader>
```
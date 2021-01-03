import VueCloudinaryUploader from "./VueCloudinaryUploader.vue";

const vue_cloudinary_uploader = {
    install(Vue, options = {}) {
        // register component globally
        // https://vuejs.org/v2/guide/components-registration.html
        Vue.component("vue-cloudinary-uploader", VueCloudinaryUploader);
    }
}

export default vue_cloudinary_uploader

if(typeof window !== 'undefined' && window.Vue){
	window.Vue.use(vue_cloudinary_uploader)
}
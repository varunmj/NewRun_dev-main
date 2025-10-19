// Ambient type declarations for JavaScript modules
declare module "*.jsx" {
  const content: any;
  export default content;
}

declare module "*.js" {
  const content: any;
  export default content;
}

// Specific module declarations
declare module "../ToastMessage/Toast" {
  const Toast: any;
  export default Toast;
}

declare module "../../utils/axiosInstance" {
  const axiosInstance: any;
  export default axiosInstance;
}

declare module "../../utils/googleMapsLoader" {
  export const useGoogleMapsLoader: any;
}

declare module "../ProfilePictureUpload/ProfilePictureUpload" {
  const ProfilePictureUpload: any;
  export default ProfilePictureUpload;
}

export interface UploadOptions {
  ingameDirectory: string;
  port?: number;
}

const defaultOptions: UploadOptions = {
  ingameDirectory: '/root/'
};

export const parseUploadOptions = (options: Partial<UploadOptions>) => {
  return {
    ingameDirectory: options.ingameDirectory ?? defaultOptions.ingameDirectory
  };
};

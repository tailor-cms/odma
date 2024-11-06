export const protocol = 'storage://';
export const provider = process.env.STORAGE_PROVIDER;

export const amazon = {
  endpoint: process.env.STORAGE_ENDPOINT,
  region: process.env.STORAGE_REGION,
  bucket: process.env.STORAGE_BUCKET,
  key: process.env.STORAGE_KEY,
  secret: process.env.STORAGE_SECRET,
};

export const filesystem = {
  path: process.env.STORAGE_PATH,
};

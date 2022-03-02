import { create, urlSource } from 'ipfs-http-client';

const ipfs = create('https://ipfs.infura.io:5001');

const upload = async function (uploadPath) {
  const file = await ipfs.add(urlSource(uploadPath));
  return file;
};

const IPFS = { 
  upload: upload
};

export default { IPFS };
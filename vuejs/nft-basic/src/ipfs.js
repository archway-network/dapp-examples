import { create, urlSource } from 'ipfs-http-client';
import { Buffer } from 'buffer';

const INFURA_API_KEY = import.meta.env.VITE_APP_INFURA_API_KEY;
const INFURA_API_SECRET = import.meta.env.VITE_APP_INFURA_API_SECRET;

const AuthHeader = 'Basic ' + Buffer.from(INFURA_API_KEY + ":" + INFURA_API_SECRET).toString('base64');
const ipfsGateway = 'https://cloudflare-ipfs.com/ipfs/';

const upload = async function (uploadPath) {

  const ipfs = await create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
      'Authorization': AuthHeader
    }
  });

  const file = await ipfs.add(urlSource(uploadPath));
  return file;
};

const IPFS = { 
  upload: upload,
  ipfsGateway: ipfsGateway
};

export default { IPFS };
import { create, urlSource } from 'ipfs-http-client';

const INFURA_PROJECT = process.env.VUE_APP_INFURA_PROJECT_ID;
const INFURA_API_SECRET = process.env.VUE_APP_INFURA_API_KEY;

const AuthHeader = 'Basic ' + Buffer.from(INFURA_PROJECT + ":" + INFURA_API_SECRET).toString('base64');
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
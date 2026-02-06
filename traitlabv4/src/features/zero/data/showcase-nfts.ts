import type { ShowcaseNFT } from '../types/zero.types';

export const SHOWCASE_GITHUB_REPO = 'adriangallery/AdrianLAB';
export const SHOWCASE_GITHUB_REF = 'd05193bc1dbc1c577c051656111a3c07281ba019';
export const SHOWCASE_GITHUB_PATH = 'public/rendered-toggles';
export const SHOWCASE_GITHUB_RAW_BASE =
  `https://raw.githubusercontent.com/${SHOWCASE_GITHUB_REPO}/${SHOWCASE_GITHUB_REF}/${SHOWCASE_GITHUB_PATH}`;

const toFallbackNft = (tokenId: string): ShowcaseNFT => ({
  tokenId,
  imageUrl: `https://adrianlab.vercel.app/api/render/${tokenId}.png`,
});

export const SHOWCASE_NFTS: ShowcaseNFT[] = [
  '1',
  '42',
  '69',
  '100',
  '123',
  '256',
  '420',
  '500',
  '666',
  '777',
  '888',
  '999',
  '1111',
  '1234',
  '1337',
  '2000',
  '2222',
  '3000',
  '3333',
  '4200',
  '5000',
  '5555',
  '6666',
  '7000',
  '7777',
  '8000',
  '8888',
  '9000',
  '9999',
  '9876',
].map(toFallbackNft);

// Next.jsの型定義をインポート
import path from 'node:path';
import type { NextConfig } from 'next';

// Next.jsの設定オブジェクト
const nextConfig: NextConfig = {
  // 静的ファイルとして書き出す（out/ を S3 に配置し、CloudFront から配信する）
  output: 'export',
  // /champion/Ahri/index.html の形で出力する
  trailingSlash: true,
  // 複数の lockfile を検出する警告を避けるため、ルートを frontend に固定する
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    // 静的書き出しでは画像の最適化サーバーが使えない
    unoptimized: true,
    // 外部画像の許可パターンを定義
    remotePatterns: [
      // LoL公式画像（ddragon.leagueoflegends.com）を許可
      {
        protocol: 'https',
        hostname: 'ddragon.leagueoflegends.com',
      },
      // Googleアカウント画像（lh3.googleusercontent.com）を許可
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

// 設定をエクスポート（Next.jsが自動で読み込む）
export default nextConfig;

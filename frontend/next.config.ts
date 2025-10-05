// Next.jsの型定義をインポート
import type { NextConfig } from "next";

// Next.jsの設定オブジェクト
const nextConfig: NextConfig = {
  images: {
    // 外部画像の許可パターンを定義
    remotePatterns: [
      // LoL公式画像（ddragon.leagueoflegends.com）を許可
      {
        protocol: "https",
        hostname: "ddragon.leagueoflegends.com",
      },
      // Googleアカウント画像（lh3.googleusercontent.com）を許可
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

// 設定をエクスポート（Next.jsが自動で読み込む）
export default nextConfig;

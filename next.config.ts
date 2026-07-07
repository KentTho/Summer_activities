import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Upload ảnh giấy tờ cho AI import đi qua Server Action (multipart).
    // App mặc định cho ảnh <= 4MB, nên limit cần lớn hơn để chứa multipart overhead.
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  /**
   * Redirect route cũ (Prompt 03A) sang cấu trúc tách cổng Admin/User (Prompt 03B).
   * Tạm thời (307) vì cấu trúc còn tiến hóa; đổi permanent khi ổn định.
   */
  async redirects() {
    return [
      { source: "/login", destination: "/user/login", permanent: false },
      {
        source: "/secretary",
        destination: "/user/secretary",
        permanent: false,
      },
      {
        source: "/secretary/:path*",
        destination: "/user/secretary/:path*",
        permanent: false,
      },
      { source: "/parent", destination: "/user/parent", permanent: false },
      {
        source: "/parent/:path*",
        destination: "/user/parent/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

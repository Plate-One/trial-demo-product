// OpenNext Cloudflare 用の最小設定（import なしでバンドルエラー回避）
// config.default が必須のため、create-cloudflare の形式に合わせる
export default {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
};

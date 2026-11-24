// 后端用户名就是 GitHub login，GitHub 对任意 login 提供公开头像地址，无需额外接口。
export function githubAvatar(login, size = 80) {
  if (!login) return undefined
  return `https://github.com/${encodeURIComponent(login)}.png?size=${size}`
}

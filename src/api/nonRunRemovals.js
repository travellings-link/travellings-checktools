import api, { call, listOf } from './client'

// 规则修订专题（倒查）专用接口。
// 独立成文件：专题结束剥离时，删本文件 + 删专题页面 + 删路由/导航两行即可，不触碰其他模块。
export const TOPIC_NONRUN = 'NONRUN'
export const TOPIC_RUN = 'RUN'

export const VERDICT_KEEP = 'KEEP'
export const VERDICT_ABNORMAL = 'ABNORMAL'
export const VERDICT_DELETE = 'DELETE'

export const VERDICT_LABEL = {
  [VERDICT_KEEP]: '符合规则',
  [VERDICT_ABNORMAL]: '异常待定',
  [VERDICT_DELETE]: '删除'
}

export const NON_RUN_REMOVAL_REASONS = ['域名易主', '网站不可访问', 'AI内容过多', '其他']
export const OTHER_REASON = '其他'

// 两个专题共用同一张台账表，靠 topic 隔离：不带 topic 会读不到数据
export async function fetchVerdicts(topic) {
  return listOf(await call(api.get('/nonRunRemovals', { params: { topic } })))
}

export async function submitVerdict({ topic, siteId, name, url, status, verdict, reason, detail }) {
  const body = await call(
    api.post('/nonRunRemovals', { topic, siteId, name, url, status, verdict, reason, detail })
  )
  return body.data
}

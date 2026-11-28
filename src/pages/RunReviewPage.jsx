import NonRunReviewPage from './NonRunReviewPage'

// 规则修订专题 · RUN 站点倒查。
// 复用非 RUN 倒查页的全部逻辑（三态判定、工作台、台账导出），只是清单来源改为 status = RUN。
// 专题结束后连同非 RUN 页一起删除。
function RunReviewPage() {
  return <NonRunReviewPage kind="run" />
}

export default RunReviewPage

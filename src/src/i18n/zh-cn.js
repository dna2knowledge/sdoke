const tr = {
   translation: {
      't.stock.viewer': '股票查看',
      't.stock.strategy': '策略编辑',
      't.stock.search': '股票筛选',
      't.stock.trade': '交易记录',
      't.about': '关于',
   },
   viewer: {
      'history.all.updated': '所有股票历史数据已更新完毕。',
      'history.warn.refetch': '确定需要重新更新股票历史数据吗？您在12小时内已经更新过一次，上一次时间是',
      'history.warn.refatch.fromerror': '上一次更新有{{v,number}}支股票数据更新失败。是否只更新这些股票的历史数据？',
      'history.warn.nostock': '应用记录的股票列表为空。在更新历史数据前，请先上传您的股票列表。',
      'history.warn.partial.fail': '以下股票的历史数据更新失败：',
      'history.quick.warn.cause.datamissing': '确定快速更新股票历史数据吗？之后可能会有{{v,number}}天的数据空缺。',
      'history.quick.warn.trade.active': '确定快速更新股票历史数据吗？交易可能还在进行中，之后数据可能会发生变化，需要重新更新。',
      'history.quick.warn.recommendfull': '确定快速更新股票历史数据吗？建议使用普通更新下载所有历史数据，快速更新只获取最近一天的数据。',
      'history.quick.start': '开始快速更新股票历史数据（获取最近一天的数据）...',
      'history.quick.partial.fail': '除了{{v,number}}支股票数据无法快速更新，其他都已经更新完毕。',
      'insight.warn.history.updating': '正在更新股票历史数据，请等待更新完成再次尝试使用这个功能。',
      'stock.list.warn.fail': '无法读取股票列表文件。',
      'btn.update.stock.list': '更新股票列表',
      'tip.stock.list.empty': '没有符合条件的股票',
      'tip.stock.no.selected': '没有数据；请选择一支股票或者',
      'tip.stock.autocomplete': '股票代码或者名称',
      't.capture': '捕获',
      't.rate': '准确率',
      't.gain.min.max': '收益 最小/最大',
      't.loss.min': '损失 最小',
      't.op.window': '操作窗口',
      't.sell': '卖出',
      't.buy': '买入',
      't.sell.s': '卖',
      't.buy.s': '买',
      't.unknown': '无',
      't.unknown.s': '-',
      't.all': '全部',
      't.3years': '3年',
      't.score': '分数',
      't.open': '开盘',
      't.close': '收盘',
      't.low': '最低',
      't.high': '最高',
      't.vol': '成交量',
      't.gain.u': '盈利',
      't.loss.u': '亏损',
      't.standardarea': '传统',
      't.kcarea': '科创板/创业板',
      't.history': '历史',
      't.histogram': '分布',
      't.list': '列表',
      't.daily': '按天',
      't.weekly': '按周',
      't.monthly': '按月',
      't.yearly': '按年',
      'view.warn.internal.error': '没有数据；发生了一个内部错误。',
      'captr.title': '资金走向分析报告',
      'captr.warn.internal.error': '没有数据；发生了一个内部错误。',
      'captr.warn.nodata': '没有数据；股票列表为空，请先更新。',
      'tip.captr.loading': '正在加载资金走向数据 ...',
      'tip.captr.nodata': '没有资金走向数据。',
      'strategy.warn.internal.error': '没有数据；发生了一个内部错误。',
      'tip.strategy.loading': '正在为 {{code}} {{name}} 应用策略 "{{strategy}}" ...',
      'tip.one.nodata': '没有数据；无法获取 {{code}} {{name}} 的数据。',
      'tip.strategy.nodata': '没有数据；无法获取 {{code}} {{name}} 在策略 "{{strategy}}" 下的数据。',
   },
   strategy: {
   },
   search: {
      't.search': '筛选',
      't.sort': '排序',
      't.stock': '股票',
      't.score': '分数',
      'tip.search.syntax.error': '筛选公式语法错误',
      'tip.sort.syntax.error': '排序公式语法错误',
      'tip.noquery': '没有数据；输入公式进行筛选',
      'tip.noresult': '没有数据；筛选条件：',
      't.filter.formula': '筛选公式',
      't.sort.formula': '排序公式',
      't.round': '第 {{v}} 轮',
      't.search': '筛选',
      't.search.fav': '在收藏中筛选',
      't.search.result': '在结果中筛选',
   },
   trade: {
   },
   about: {
   },
};

export default tr;
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
      't.history': '历史',
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
      't.close.ui': '关闭',
      't.refresh': '刷新',
      't.goto.edit.strategy': '编辑策略',
      't.add.fav': '收藏',
      't.update.history': '更新历史数据',
      't.do.captr': '资金走向分析',
      't.strategy.example.rsibase': '策略演示 (RSI)',
      'view.warn.internal.error': '没有数据；发生了一个内部错误。',
      'captr.title': '资金走向分析报告',
      'captr.warn.internal.error': '没有数据；发生了一个内部错误。',
      'captr.warn.nodata': '没有数据；股票列表为空，请先更新。',
      'tip.captr.loading': '正在加载资金走向数据 ...',
      'tip.captr.nodata': '没有资金走向数据。',
      'strategy.warn.internal.error': '没有数据；发生了一个内部错误。',
      'strategy.warn.nosuch.strategy': '抱歉，这个策略已经不存在。',
      'tip.strategy.loading': '正在为 {{code}} {{name}} 应用策略 "{{strategy}}" ...',
      'tip.one.nodata': '没有数据；无法获取 {{code}} {{name}} 的数据。',
      'tip.strategy.nodata': '没有数据；无法获取 {{code}} {{name}} 在策略 "{{strategy}}" 下的数据。',
      'strategy.warn.thisisjustanexample': '选择的策略只用于演示。请到“策略编辑”页面创建您自己的交易策略。'
   },
   strategy: {
      'tip.warn.notsaved': '已经有一个正在编辑的策略；是否要放弃保存，创建一个新策略？',
      'tip.warn.name.required': '策略必须有一个名字。',
      'tip.warn.overwrite.existing': '有一个已保存的同名策略"{{v}}"，确认保存并覆盖这个策略么？',
      'tip.warn.nostrategy': '没有可选择的策略',
      'tip.warn.noselect': '没有策略数据；请选择一个已保存的策略或者',
      'tip.warn.discard.new': '确认放弃编辑这个新策略',
      'tip.warn.delete': '确认删除策略',
      'tip.warn.notsaved': '正在编辑中的策略还没有保存。',
      't.strategy.name': '策略名称',
      't.create.strategy': '添加新策略',
      't.basicinfo': '基本信息',
      't.search': '股票筛选',
      't.scorerule': '买卖信号规则',
      't.desc.scorerule': '定义一些列买卖信号的规则；1表示最强买信号，-1表示最强卖信号。',
      't.add.scorerule': '添加规则',
      't.scorerule.condition': '判定条件',
      't.scorerule.scoreformula': '信号公式',
      't.vis': '可视化',
      't.desc.vis': '定义一组计算最近250天指标的可视化公式',
      't.add.vis': '添加可视化',
      't.vis.group': '分组',
      't.vis.visformula': '可视化公式',
      't.basic': '交易策略',
      't.basic.name': '名称',
      't.basic.desc': '描述',
      't.save': '保存',
      't.cancel': '取消/重置',
      't.fillexample': '填入演示信息',
      't.delete': '删除',
      't.example.desc.rsibase': 'RSI (<30 => 买入, >70 => 卖出)',
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
      't.result.total': '共 {{v}} 个结果',
      't.search': '筛选',
      't.search.fav': '在收藏中筛选',
      't.search.result': '在结果中筛选',
   },
   trade: {
      't.refresh': '刷新',
      't.add.trade': '添加交易记录',
      't.edit': '编辑',
      't.remove': '删除',
      't.start.date': '开始追踪时间',
      't.buyin': '买入',
      't.buyin.date': '买入时间',
      't.buyin.price': '买入价格',
      't.sellout': '卖出',
      't.sellout.date': '卖出时间',
      't.sellout.price': '卖出价格',
      't.save': '保存',
      't.cancel': '取消',
      't.close.ui': '关闭',
      'tip.nodata': '没有交易记录',
      'tip.edit.noselect.stock': '请选择一个股票来记录交易。',
      'tip.edit.invalid.date': '请输入正确的时间 (YYYY-MM-DD)。',
      'tip.edit.invalid.buyin.date': '请输入正确的买入时间 (YYYY-MM-DD)。',
      'tip.edit.invalid.buyin.price': '请输入正确的买入价格。',
      'tip.edit.invalid.nobuyin': '请先正确设置买入时间和价格。',
      'tip.edit.invalid.sellout.date': '请输入正确的卖出时间 (YYYY-MM-DD)。',
      'tip.edit.invalid.sellout.price': '请输入正确的卖出价格 (YYYY-MM-DD)。',
      'tip.stock.autocomplete': '股票代码或者名称',
      'tip.stock.list.empty': '没有符合条件的股票',
      'edit.warn.remove': '确定删除这则交易记录：',
   },
   about: {
      't.name': '应用名称',
      't.nameval': 'Sdoke',
      't.author': '软件作者',
      't.authorval': 'Seven Liu 和所有其他相关贡献者',
      't.license': '开源协议',
      't.note': '特别申明',
      't.noteval': '本软件提供的信息不构成任何投资建议。股市有风险，投资需谨慎。',
      't.language': '界面语言',
   },
};

export default tr;
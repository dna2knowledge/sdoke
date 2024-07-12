import eventbus from '$/service/eventbus';

export default function StockLink(props) {
   const { data } = props;
   const onStockTitleClick = () => {
      const holdData = data;
      eventbus.comp.waitUntil('comp.stock.stock-panel').then(() => {
         eventbus.emit('stock.pinned.click', {
            code: holdData.code,
            name: holdData.name,
         });
      });
   };
   return <a href="#/" onClick={onStockTitleClick}>{data.code} {data.name}</a>;
}

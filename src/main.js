
function calculateSimpleRevenue(purchase, _product) {
//Расчет выручки от операции
   const { discount, sale_price, quantity } = purchase; //достать параметры
   const revenue = sale_price * quantity * (1 - discount / 100); //формула рассчета выручки от операции
   return revenue;
}



function calculateBonusByProfit(index, total, seller) {
//Расчет бонуса от позиции в рейтинге
    const { profit } = seller;

    if (index === 0) {
        return profit * 0.15;
    } else if (index === 1 || index === 2) {
        return profit * 0.10;
    } else if (index === total - 1) {
        return 0;
    } else {
        return profit * 0.05;
    }
}



function analyzeSalesData(data, options) {

    
//Проверка входных данных data
    if (   !data
        || !Array.isArray(data.sellers)
        || !Array.isArray(data.products)
        || !Array.isArray(data.purchase_records)
        || data.sellers.length === 0
        || data.products.length === 0
        || data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }


//Проверка options
    if (   !options
        || typeof options !== 'object'
    ) {
        throw new Error('Некорректные опции');
    }

    const { calculateRevenue, calculateBonus } = options; 

    if (   typeof calculateRevenue !== 'function'
        || typeof calculateBonus !== 'function'
    ) {
        throw new Error('Опции должны содержать функции calculateRevenue и calculateBonus');
    }


//Подготовка промежуточных данных для сбора статистики
    //создаем массив для хранения статистики по каждому продавцу
    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    })); 


//Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = Object.fromEntries(
    sellerStats.map(seller => [seller.id, seller])
);

    const productIndex = Object.fromEntries(
    data.products.map(product => [product.sku, product])
);


//Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => {
    const seller = sellerIndex[record.seller_id];

    seller.sales_count += 1;
    seller.revenue += record.total_amount;

    record.items.forEach(item => {
        const product = productIndex[item.sku];

        const cost = product.purchase_price * item.quantity;
        const revenue = calculateRevenue(item, product);
        const profit = revenue - cost;

        seller.profit += profit;

        if (!seller.products_sold[item.sku]) {
            seller.products_sold[item.sku] = 0;
        }

        seller.products_sold[item.sku] += item.quantity;
    });
});


//Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);


//Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonus(index, sellerStats.length, seller);

    seller.top_products = Object.entries(seller.products_sold)
        .map(([sku, quantity]) => ({
            sku,
            quantity
        }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
});


//Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
    seller_id: seller.id,
    name: seller.name,
    revenue: +seller.revenue.toFixed(2),
    profit: +seller.profit.toFixed(2),
    sales_count: seller.sales_count,
    top_products: seller.top_products,
    bonus: +seller.bonus.toFixed(2)
}));
}

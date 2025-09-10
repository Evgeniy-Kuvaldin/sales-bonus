/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) { // _product - игнорируется (зарезервирован на будущее)
   // @TODO: Расчет выручки от операции
   const {discount, sale_price, quantity} = purchase;
   const discountFactor = 1 - (discount/100);
   return sale_price * quantity * discountFactor;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const {profit} = seller;

    if (index === 0) {
        return 0.15 * profit;
    } else if (index === 1 || index === 2) {
        return 0.1 * profit;
    } else if (index === (total - 1)) {
        return 0;
    } else { 
        return 0.05 * profit;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if (!data
        || !Array.isArray(data.sellers)
        || data.sellers.length === 0
    ) {
        throw new Error ('Некорректные входные данные');
    }

    if (typeof options !== "object") {
        throw new Error ('options - не является объектом');
    }

    // @TODO: Проверка наличия опций
    const {calculateRevenue, calculateBonus} = options;

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        sales_count: 0,
        profit: 0,
        products_sold: {}
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = Object.fromEntries(
        data.sellers.map(seller => [seller.id, seller])
    );

    const productIndex = Object.fromEntries(
        data.products.map(product => [product.sku, product])
    );

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => { // Чек 
        const seller = sellerIndex[record.seller_id]; // Продавец
        seller.sales_count ++;// Увеличить количество продаж 
        seller.revenue += record.total_amount;// Увеличить общую сумму всех продаж

        // Расчёт прибыли для каждого товара
        record.items.forEach(item => {
            const product = productIndex[item.sku]; // Товар

            const cost = product.purchase_price * item.quantity;// Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
            const itemRevenue = calculateRevenue(item, product);

            seller.revenue += itemRevenue;// Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
            seller.profit += itemRevenue - cost;// Посчитать прибыль: выручка минус себестоимость
        // Увеличить общую накопленную прибыль (profit) у продавца  

            // Учёт количества проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            } 
            seller.products_sold[item.sku] += item.quantity;
             // По артикулу товара увеличить его проданное количество у продавца
        });
    });

    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => a - b);

    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, total, seller);

        const arrayProducts = Object.entries(seller.products_sold).map(([sku, quantity]) =>
            ({
                sku,
                quantity
            })
        );

        arrayProducts.sort((a, b) => b.quantity - a.quantity);

        seller.top_product = arrayProducts.slice(0, 10);
    });

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
        seller_id: seller.id,// Строка, идентификатор продавца
        name: seller.name,// Строка, имя продавца
        revenue: +seller.revenue.toFixed(2),// Число с двумя знаками после точки, выручка продавца
        profit: +seller.profit.toFixed(2),// Число с двумя знаками после точки, прибыль продавца
        sales_count: seller.sales_count,// Целое число, количество продаж продавца
        top_products: seller.top_product,// Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
        bonus: +seller.bonus.toFixed(2)// Число с двумя знаками после точки, бонус продавца
    }));

}
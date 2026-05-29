const LIMIT_STORAGE_KEY = 'familyWeeklyLimit';
const EXPENSES_STORAGE_KEY = 'familyExpenses';
const HISTORY_STORAGE_KEY = 'familyWeekHistory';
const CATEGORIES_STORAGE_KEY = 'familyExpenseCategories';

const DEFAULT_CATEGORIES = ['Продукты', 'Транспорт', 'Развлечения', 'Прочее'];

const limitForm = document.querySelector('#limit-form');
const limitInput = document.querySelector('#weekly-limit');
const statusMessage = document.querySelector('#save-status');
const categoryForm = document.querySelector('#category-form');
const categoryNameInput = document.querySelector('#category-name');
const categoryStatusMessage = document.querySelector('#category-status');
const categoryList = document.querySelector('#category-list');
const expenseForm = document.querySelector('#expense-form');
const expenseAmountInput = document.querySelector('#expense-amount');
const expenseCategorySelect = document.querySelector('#expense-category');
const expenseStatusMessage = document.querySelector('#expense-status');
const expenseList = document.querySelector('#expense-list');
const remainingBudget = document.querySelector('#remaining-budget');
const mascotBlock = document.querySelector('#mascot-block');
const mascotMessage = document.querySelector('#mascot-message');
const endWeekButton = document.querySelector('#end-week-button');
const weekStatusMessage = document.querySelector('#week-status');
const historyList = document.querySelector('#history-list');

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 2,
  }).format(amount);
};

const readStoredArray = (storageKey) => {
  const savedValue = localStorage.getItem(storageKey);

  if (!savedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(savedValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
};

const readExpenses = () => readStoredArray(EXPENSES_STORAGE_KEY);

const readHistory = () => readStoredArray(HISTORY_STORAGE_KEY);

const normalizeCategoryName = (categoryName) => {
  return categoryName.trim().replace(/\s+/g, ' ');
};

const getUniqueCategories = (categories) => {
  const seenCategories = new Set();

  return categories.reduce((uniqueCategories, category) => {
    const normalizedCategory = normalizeCategoryName(String(category));
    const categoryKey = normalizedCategory.toLowerCase();

    if (!normalizedCategory || seenCategories.has(categoryKey)) {
      return uniqueCategories;
    }

    seenCategories.add(categoryKey);
    uniqueCategories.push(normalizedCategory);
    return uniqueCategories;
  }, []);
};

const readCategories = () => {
  const savedCategories = getUniqueCategories(readStoredArray(CATEGORIES_STORAGE_KEY));
  return savedCategories.length > 0 ? savedCategories : [...DEFAULT_CATEGORIES];
};

const saveExpenses = (expenses) => {
  localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
};

const saveHistory = (history) => {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
};

const saveCategories = (categories) => {
  localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(getUniqueCategories(categories)));
};

const getLimit = () => {
  return Number.parseFloat(limitInput.value) || 0;
};

const getTotalExpenses = (expenses = readExpenses()) => {
  return expenses.reduce((total, expense) => {
    return total + (Number.parseFloat(expense.amount) || 0);
  }, 0);
};

const getRemainingBudget = () => {
  return getLimit() - getTotalExpenses();
};

const getTopExpenseCategory = (expenses) => {
  const totalsByCategory = expenses.reduce((totals, expense) => {
    const category = expense.category || 'Прочее';
    totals[category] = (totals[category] || 0) + (Number.parseFloat(expense.amount) || 0);
    return totals;
  }, {});

  return Object.entries(totalsByCategory).sort((first, second) => {
    return second[1] - first[1];
  })[0]?.[0] || 'расходы';
};

const getCategoryAdvice = (category, isOverLimit) => {
  const normalizedCategory = category.toLowerCase();
  const categoryAdvice = {
    продукты: isOverLimit
      ? 'Холодильник, конечно, важный член семьи, но ему пора перестать жить как директор супермаркета.'
      : 'Похоже, корзина продуктов тренируется стать тележкой. Проверь список покупок перед следующим заходом.',
    транспорт: isOverLimit
      ? 'Транспорт везет бюджет куда-то не туда. Может, пару маршрутов пройти пешком и дать кошельку отдышаться?'
      : 'Колеса крутятся, деньги машут рукой. Посмотри, где можно заменить поездку прогулкой.',
    развлечения: isOverLimit
      ? 'Веселье удалось настолько, что бюджет попросил отпуск. На этой неделе развлекаемся бесплатными способами.'
      : 'Развлечения уже аплодируют стоя. Дальше лучше выбирать радость без кассы.',
    прочее: isOverLimit
      ? 'Категория "прочее" снова притворилась мелочью, а сама вынесла бюджет через черный ход.'
      : 'У "прочего" подозрительно загадочный вид. Разберись, что там прячется.',
  };

  return categoryAdvice[normalizedCategory] || (
    isOverLimit
      ? `Категория "${category}" сегодня явно решила почувствовать себя звездой расходов. Дай ей паузу до следующей недели.`
      : `Категория "${category}" набирает обороты. Самое время спросить: это точно нужно сейчас?`
  );
};

const updateMascotMessage = () => {
  const limit = getLimit();
  const expenses = readExpenses();
  const totalExpenses = getTotalExpenses(expenses);
  const isRiskZone = limit > 0 && totalExpenses > limit * 0.8;
  const isOverLimit = limit > 0 && totalExpenses > limit;
  const topCategory = getTopExpenseCategory(expenses).toLowerCase();

  mascotBlock.classList.toggle('warning', isRiskZone && !isOverLimit);
  mascotBlock.classList.toggle('over-limit', isOverLimit);

  if (isOverLimit) {
    mascotMessage.textContent = `Вот ты транжира недели: лимит уже пробит. Самая тяжелая категория: ${topCategory}. ${getCategoryAdvice(topCategory, true)}`;
    return;
  }

  mascotMessage.textContent = isRiskZone
    ? `Бюджет уже нервно поправляет очки: расходы перевалили за 80% лимита. Лидер забега: ${topCategory}. ${getCategoryAdvice(topCategory, false)}`
    : 'Пока все спокойно: лимит держится, бюджет дышит ровно.';
};

const updateRemainingBudget = () => {
  const remaining = getRemainingBudget();
  remainingBudget.textContent = formatCurrency(remaining);
  remainingBudget.classList.toggle('over-limit', remaining < 0);
  updateMascotMessage();
  return remaining;
};

const renderExpenses = () => {
  const expenses = readExpenses();
  expenseList.innerHTML = '';

  if (expenses.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'empty-state';
    emptyItem.textContent = 'Расходов пока нет';
    expenseList.append(emptyItem);
    updateRemainingBudget();
    return;
  }

  expenses.forEach((expense) => {
    const item = document.createElement('li');
    const category = document.createElement('span');
    const amount = document.createElement('span');
    const expenseAmount = Number.parseFloat(expense.amount) || 0;

    item.className = 'expense-item';
    category.className = 'expense-category';
    amount.className = 'expense-amount';

    category.textContent = expense.category;
    amount.textContent = formatCurrency(expenseAmount);

    item.append(category, amount);
    expenseList.append(item);
  });

  updateRemainingBudget();
};

const renderCategories = (selectedCategory = expenseCategorySelect.value) => {
  const categories = readCategories();

  expenseCategorySelect.innerHTML = '';
  categoryList.innerHTML = '';

  categories.forEach((category) => {
    const option = document.createElement('option');
    const item = document.createElement('li');

    option.value = category;
    option.textContent = category;
    item.className = 'category-item';
    item.textContent = category;

    expenseCategorySelect.append(option);
    categoryList.append(item);
  });

  if (categories.includes(selectedCategory)) {
    expenseCategorySelect.value = selectedCategory;
  }
};

const renderHistory = () => {
  const history = readHistory();
  historyList.innerHTML = '';

  if (history.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'empty-state';
    emptyItem.textContent = 'Завершенных недель пока нет';
    historyList.append(emptyItem);
    return;
  }

  history.forEach((week, index) => {
    const item = document.createElement('li');
    const header = document.createElement('div');
    const title = document.createElement('span');
    const remaining = document.createElement('span');
    const meta = document.createElement('div');
    const limitRow = document.createElement('div');
    const totalRow = document.createElement('div');
    const carryRow = document.createElement('div');
    const expensesBlock = document.createElement('div');
    const expensesTitle = document.createElement('div');
    const expenses = Array.isArray(week.expenses) ? week.expenses : [];
    const finishedDate = week.finishedAt
      ? new Date(week.finishedAt).toLocaleDateString('ru-RU')
      : 'Дата не указана';

    item.className = 'history-item';
    header.className = 'history-header';
    title.className = 'history-date';
    remaining.className = 'expense-amount';
    meta.className = 'history-meta';
    limitRow.className = 'history-row';
    totalRow.className = 'history-row';
    carryRow.className = 'history-row';
    expensesBlock.className = 'history-expenses';

    title.textContent = `Неделя ${history.length - index}: ${finishedDate}`;
    remaining.textContent = `Остаток: ${formatCurrency(week.remaining || 0)}`;
    appendMetricRow(limitRow, 'Лимит', week.limit || 0);
    appendMetricRow(totalRow, 'Расходы', week.totalExpenses || 0);
    appendMetricRow(carryRow, 'Перенос', week.carryover || 0);
    expensesTitle.textContent = 'Расходы недели';

    header.append(title, remaining);
    meta.append(limitRow, totalRow, carryRow);
    item.append(header, meta);

    if (expenses.length > 0) {
      const expenseItems = document.createElement('ul');

      expenses.forEach((expense) => {
        const expenseItem = document.createElement('li');
        const expenseAmount = Number.parseFloat(expense.amount) || 0;
        expenseItem.textContent = `${expense.category}: ${formatCurrency(expenseAmount)}`;
        expenseItems.append(expenseItem);
      });

      expensesBlock.append(expensesTitle, expenseItems);
      item.append(expensesBlock);
    }

    historyList.append(item);
  });
};

const appendMetricRow = (row, label, amount) => {
  const labelElement = document.createElement('span');
  const amountElement = document.createElement('strong');

  labelElement.textContent = label;
  amountElement.textContent = formatCurrency(amount);
  row.append(labelElement, amountElement);
};

const setStatus = (element, message, isError = false) => {
  element.textContent = message;
  element.classList.toggle('error', isError);
};

const savedLimit = localStorage.getItem(LIMIT_STORAGE_KEY);

if (savedLimit !== null) {
  limitInput.value = savedLimit;
}

limitForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const limitValue = limitInput.value.trim();
  localStorage.setItem(LIMIT_STORAGE_KEY, limitValue);
  setStatus(statusMessage, 'Лимит сохранен');
  updateRemainingBudget();
});

categoryForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const categoryName = normalizeCategoryName(categoryNameInput.value);
  const categories = readCategories();
  const categoryExists = categories.some((category) => {
    return category.toLowerCase() === categoryName.toLowerCase();
  });

  if (!categoryName) {
    setStatus(categoryStatusMessage, 'Введите название категории', true);
    return;
  }

  if (categoryExists) {
    setStatus(categoryStatusMessage, 'Такая категория уже есть', true);
    return;
  }

  categories.push(categoryName);
  saveCategories(categories);
  categoryNameInput.value = '';
  renderCategories(categoryName);
  setStatus(categoryStatusMessage, 'Категория добавлена');
});

expenseForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const amount = Number.parseFloat(expenseAmountInput.value);

  if (!Number.isFinite(amount) || amount <= 0) {
    setStatus(expenseStatusMessage, 'Введите сумму больше 0', true);
    return;
  }

  const expenses = readExpenses();
  expenses.push({
    amount,
    category: expenseCategorySelect.value,
  });

  saveExpenses(expenses);
  expenseAmountInput.value = '';
  setStatus(expenseStatusMessage, 'Расход добавлен');
  renderExpenses();
});

endWeekButton.addEventListener('click', () => {
  const expenses = readExpenses();
  const limit = getLimit();
  const totalExpenses = getTotalExpenses(expenses);
  const remaining = limit - totalExpenses;
  const carryover = remaining > 0 ? remaining : 0;
  const history = readHistory();

  history.unshift({
    id: Date.now(),
    finishedAt: new Date().toISOString(),
    limit,
    totalExpenses,
    remaining,
    carryover,
    expenses,
  });

  saveHistory(history);
  saveExpenses([]);

  const nextLimit = limit + carryover;
  limitInput.value = String(nextLimit);
  localStorage.setItem(LIMIT_STORAGE_KEY, String(nextLimit));

  setStatus(
    weekStatusMessage,
    carryover > 0
      ? `Неделя завершена. Перенесено: ${formatCurrency(carryover)}`
      : 'Неделя завершена без переноса'
  );
  setStatus(expenseStatusMessage, '');
  renderExpenses();
  renderHistory();
});

renderCategories();
renderExpenses();
renderHistory();

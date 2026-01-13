const API_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru/api';
const API_KEY = 'df3ddd20-e6f4-42a6-a275-d7ac1de8a55f';

let allOrders = [];
let currentOrderBasePrice = 0;

document.addEventListener('DOMContentLoaded', () => {
    fetchOrders();
    setMinimumDate(); 
});

// Получение списка
async function fetchOrders() {
    try {
        const response = await fetch(`${API_URL}/orders?api_key=${API_KEY}`);
        allOrders = await response.json();
        renderTable(allOrders);
    } catch (e) { showAlert('Ошибка загрузки', 'danger'); }
}

function renderTable(orders) {
    const tbody = document.getElementById('orders-table-body');
    tbody.innerHTML = '';
    orders.forEach((order, i) => {
        tbody.innerHTML += `
            <tr>
                <td>${i + 1}</td>
                <td>Курс #${order.course_id}</td>
                <td>${order.date_start}</td>
                <td>${order.price} ₽</td>
                <td>
                    <button class="btn btn-outline-info btn-sm" onclick="showDetails(${order.id})">Подробнее</button>
                    <button class="btn btn-outline-warning btn-sm" onclick="editOrder(${order.id})">Изменить</button>
                    <button class="btn btn-outline-danger btn-sm" onclick="confirmDelete(${order.id})">Удалить</button>
                </td>
            </tr>`;
    });
}

function setMinimumDate() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const minDateStr = `${yyyy}-${mm}-${dd}`;

    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        input.setAttribute('min', minDateStr);
    });
}


// ДИНАМИЧЕСКИЙ ПЕРЕСЧЕТ ПРИ РЕДАКТИРОВАНИИ
function calculateDynamicPrice() {
    const persons = parseInt(document.getElementById('edit-persons').value) || 1;
    let price = currentOrderBasePrice * persons;

    if (document.getElementById('edit-early').checked) price *= 0.9;
    if (document.getElementById('edit-intensive').checked) price *= 1.2;
    if (document.getElementById('edit-suppl').checked) price += (2000 * persons);

    document.getElementById('edit-total-price').innerText = Math.round(price);
}


document.getElementById('edit-order-form').addEventListener('input', calculateDynamicPrice);
document.getElementById('edit-order-form').addEventListener('change', calculateDynamicPrice);

// ПРОСМОТР
async function showDetails(id) {
    const res = await fetch(`${API_URL}/orders/${id}?api_key=${API_KEY}`);
    const o = await res.json();
    
    document.getElementById('show-course-name').innerText = `Курс #${o.course_id}`;
    document.getElementById('show-date').innerText = o.date_start;
    document.getElementById('show-time').innerText = o.time_start;
    document.getElementById('show-persons').innerText = o.persons;
    document.getElementById('show-duration').innerText = o.duration;
    document.getElementById('show-price').innerText = o.price;
    
    let optHtml = '<strong>Опции:</strong><br>';
    if (o.early_registration) optHtml += '- Ранняя регистрация<br>';
    if (o.intensive_course) optHtml += '- Интенсив<br>';
    if (o.supplementary) optHtml += '- Доп. материалы<br>';
    document.getElementById('show-options').innerHTML = optHtml;

    new bootstrap.Modal(document.getElementById('showOrderModal')).show();
}

// ИЗМЕНИТЬ
async function editOrder(id) {
    const res = await fetch(`${API_URL}/orders/${id}?api_key=${API_KEY}`);
    const o = await res.json();

    const dateInput = document.getElementById('edit-date');

    setMinimumDate();
    
    document.getElementById('edit-order-id').value = o.id;
    document.getElementById('edit-course-name').value = `Курс #${o.course_id}`;
    document.getElementById('edit-date').value = o.date_start;
    document.getElementById('edit-time').value = o.time_start;
    document.getElementById('edit-persons').value = o.persons;
    document.getElementById('edit-early').checked = !!o.early_registration;
    document.getElementById('edit-intensive').checked = !!o.intensive_course;
    document.getElementById('edit-suppl').checked = !!o.supplementary;

    // Вычисляем базовую цену одного человека (примерно), чтобы калькулятор работал
    currentOrderBasePrice = o.price / (o.persons || 1); 
    if (o.early_registration) currentOrderBasePrice /= 0.9;
    
    calculateDynamicPrice(); // Считаем сразу
    new bootstrap.Modal(document.getElementById('editOrderModal')).show();
}

// СОХРАНИТЬ (PUT)
document.getElementById('save-order-btn').addEventListener('click', async () => {
    const id = document.getElementById('edit-order-id').value;
    const data = {
        date_start: document.getElementById('edit-date').value,
        time_start: document.getElementById('edit-time').value,
        persons: parseInt(document.getElementById('edit-persons').value),
        early_registration: document.getElementById('edit-early').checked ? 1 : 0,
        intensive_course: document.getElementById('edit-intensive').checked ? 1 : 0,
        supplementary: document.getElementById('edit-suppl').checked ? 1 : 0,
        price: parseInt(document.getElementById('edit-total-price').innerText)
    };

    const res = await fetch(`${API_URL}/orders/${id}?api_key=${API_KEY}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (res.ok) {
        bootstrap.Modal.getInstance(document.getElementById('editOrderModal')).hide();
        fetchOrders();
        showAlert('Заказ обновлен', 'success');
    }
});

// УДАЛИТЬ (DELETE)
let idToDelete = null;
function confirmDelete(id) {
    idToDelete = id;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
}

document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
    await fetch(`${API_URL}/orders/${idToDelete}?api_key=${API_KEY}`, { method: 'DELETE' });
    bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
    fetchOrders();
    showAlert('Заказ удален', 'warning');
});

function showAlert(m, t) {
    const c = document.getElementById('alerts-container');
    c.innerHTML = `<div class="alert alert-${t} alert-dismissible fade show">${m}<button class="btn-close" data-bs-dismiss="alert"></button></div>`;
}
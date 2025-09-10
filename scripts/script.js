// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const booksContainer = document.getElementById('books-container');
const historyContainer = document.getElementById('history-container');
const searchInput = document.getElementById('search-input');
const categoryButtons = document.querySelectorAll('.category-btn');
const statusFilters = document.querySelectorAll('input[type="checkbox"]');
const gridViewBtn = document.getElementById('grid-view');
const listViewBtn = document.getElementById('list-view');
const addBookBtn = document.getElementById('add-book-btn');
const bookModal = document.getElementById('book-modal');
const borrowModal = document.getElementById('borrow-modal');
const bookForm = document.getElementById('book-form');
const borrowForm = document.getElementById('borrow-form');
const closeModalButtons = document.querySelectorAll('.close-modal');
const cancelButtons = document.querySelectorAll('.btn-secondary');

// Sample data
let books = JSON.parse(localStorage.getItem('books')) || [
    {
        id: 1,
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        category: 'fiction',
        isbn: '9780743273565',
        published: 1925,
        status: 'available'
    },
    {
        id: 2,
        title: 'A Brief History of Time',
        author: 'Stephen Hawking',
        category: 'science',
        isbn: '9780553380163',
        published: 1988,
        status: 'available'
    },
    {
        id: 3,
        title: 'Sapiens: A Brief History of Humankind',
        author: 'Yuval Noah Harari',
        category: 'history',
        isbn: '9780062316097',
        published: 2011,
        status: 'borrowed',
        borrower: 'John Smith',
        borrowDate: '2023-05-15',
        returnDate: '2023-06-15'
    },
    {
        id: 4,
        title: 'Steve Jobs',
        author: 'Walter Isaacson',
        category: 'biography',
        isbn: '9781451648539',
        published: 2011,
        status: 'available'
    },
    {
        id: 5,
        title: 'Educated',
        author: 'Tara Westover',
        category: 'non-fiction',
        isbn: '9780399590504',
        published: 2018,
        status: 'borrowed',
        borrower: 'Emily Johnson',
        borrowDate: '2023-06-01',
        returnDate: '2023-06-29'
    },
    {
        id: 6,
        title: 'The Immortal Life of Henrietta Lacks',
        author: 'Rebecca Skloot',
        category: 'science',
        isbn: '9781400052172',
        published: 2010,
        status: 'available'
    }
];

let history = JSON.parse(localStorage.getItem('history')) || [
    {
        id: 1,
        bookId: 3,
        bookTitle: 'Sapiens: A Brief History of Humankind',
        borrower: 'John Smith',
        borrowDate: '2023-05-15',
        returnDate: '2023-06-15',
        returned: false
    },
    {
        id: 2,
        bookId: 5,
        bookTitle: 'Educated',
        borrower: 'Emily Johnson',
        borrowDate: '2023-06-01',
        returnDate: '2023-06-29',
        returned: false
    },
    {
        id: 3,
        bookId: 2,
        bookTitle: 'A Brief History of Time',
        borrower: 'Michael Brown',
        borrowDate: '2023-04-10',
        returnDate: '2023-05-10',
        returned: true,
        returnedDate: '2023-05-05'
    }
];

let currentBookId = null;
let currentCategory = 'all';
let currentView = 'grid';

// Initialize the app
function init() {
    // Check for saved theme preference
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Render books and history
    renderBooks();
    renderHistory();
    
    // Set up event listeners
    setupEventListeners();
}

// Set up event listeners
function setupEventListeners() {
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Search input
    searchInput.addEventListener('input', debounce(renderBooks, 300));
    
    // Category filters
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentCategory = button.dataset.category;
            renderBooks();
        });
    });
    
    // Status filters
    statusFilters.forEach(filter => {
        filter.addEventListener('change', renderBooks);
    });
    
    // View options
    gridViewBtn.addEventListener('click', () => {
        currentView = 'grid';
        updateViewButtons();
        renderBooks();
    });
    
    listViewBtn.addEventListener('click', () => {
        currentView = 'list';
        updateViewButtons();
        renderBooks();
    });
    
    // Add book button
    addBookBtn.addEventListener('click', () => {
        document.getElementById('modal-title').textContent = 'Add New Book';
        bookForm.reset();
        currentBookId = null;
        openModal(bookModal);
    });
    
    // Form submissions
    bookForm.addEventListener('submit', handleBookSubmit);
    borrowForm.addEventListener('submit', handleBorrowSubmit);
    
    // Modal close buttons
    closeModalButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
    
    cancelButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
}

// Toggle between light and dark themes
function toggleTheme() {
    if (document.documentElement.getAttribute('data-theme') === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

// Update active state of view buttons
function updateViewButtons() {
    if (currentView === 'grid') {
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        booksContainer.classList.remove('list-view');
    } else {
        gridViewBtn.classList.remove('active');
        listViewBtn.classList.add('active');
        booksContainer.classList.add('list-view');
    }
}

// Render books based on filters and search
function renderBooks() {
    const searchTerm = searchInput.value.toLowerCase();
    const showAvailable = document.getElementById('filter-available').checked;
    const showBorrowed = document.getElementById('filter-borrowed').checked;
    
    // Filter books based on search, category, and status
    const filteredBooks = books.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm) || 
                             book.author.toLowerCase().includes(searchTerm);
        const matchesCategory = currentCategory === 'all' || book.category === currentCategory;
        const matchesStatus = (book.status === 'available' && showAvailable) || 
                             (book.status === 'borrowed' && showBorrowed);
        
        return matchesSearch && matchesCategory && matchesStatus;
    });
    
    // Clear container
    booksContainer.innerHTML = '';
    
    if (filteredBooks.length === 0) {
        booksContainer.innerHTML = `
            <div class="no-books">
                <i class="fas fa-book-open"></i>
                <p>No books found. Try adjusting your filters or add a new book.</p>
            </div>
        `;
        return;
    }
    
    // Render books
    filteredBooks.forEach(book => {
        const bookElement = createBookElement(book);
        booksContainer.appendChild(bookElement);
    });
}

// Create book element
function createBookElement(book) {
    const bookElement = document.createElement('div');
    bookElement.className = 'book-card';
    bookElement.dataset.id = book.id;
    
    const categoryLabel = book.category.charAt(0).toUpperCase() + book.category.slice(1);
    
    bookElement.innerHTML = `
        <div class="book-cover">
            <i class="fas fa-book"></i>
        </div>
        <div class="book-details">
            <h3 class="book-title">${book.title}</h3>
            <p class="book-author">${book.author}</p>
            <div class="book-meta">
                <span class="book-category">${categoryLabel}</span>
                <span class="book-status ${book.status === 'available' ? 'status-available' : 'status-borrowed'}">
                    <i class="fas ${book.status === 'available' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                    ${book.status === 'available' ? 'Available' : 'Borrowed'}
                </span>
            </div>
        </div>
        <div class="book-actions">
            <button class="book-action borrow-btn" ${book.status === 'borrowed' ? 'disabled' : ''}>
                <i class="fas fa-hand-holding"></i>
                ${book.status === 'available' ? 'Borrow' : 'Borrowed'}
            </button>
            <button class="book-action return-btn" ${book.status === 'available' ? 'disabled' : ''}>
                <i class="fas fa-undo"></i>
                Return
            </button>
        </div>
    `;
    
    // Add event listeners to action buttons
    const borrowBtn = bookElement.querySelector('.borrow-btn');
    const returnBtn = bookElement.querySelector('.return-btn');
    
    if (book.status === 'available') {
        borrowBtn.addEventListener('click', () => {
            currentBookId = book.id;
            openModal(borrowModal);
        });
    }
    
    if (book.status === 'borrowed') {
        returnBtn.addEventListener('click', () => {
            returnBook(book.id);
        });
    }
    
    return bookElement;
}

// Render borrowing history
function renderHistory() {
    // Clear container
    historyContainer.innerHTML = '';
    
    if (history.length === 0) {
        historyContainer.innerHTML = `
            <div class="no-history">
                <i class="fas fa-history"></i>
                <p>No borrowing history yet.</p>
            </div>
        `;
        return;
    }
    
    // Render history items
    history.forEach(item => {
        const historyElement = document.createElement('div');
        historyElement.className = 'history-item';
        
        const borrowDate = new Date(item.borrowDate).toLocaleDateString();
        const returnDate = new Date(item.returnDate).toLocaleDateString();
        
        historyElement.innerHTML = `
            <div class="history-info">
                <div class="history-book">${item.bookTitle}</div>
                <div class="history-borrower">Borrowed by: ${item.borrower}</div>
            </div>
            <div class="history-date">
                <div>${borrowDate} - ${returnDate}</div>
                <div class="${item.returned ? 'history-returned' : 'history-pending'}">
                    ${item.returned ? 'Returned' : 'Pending'}
                </div>
            </div>
        `;
        
        historyContainer.appendChild(historyElement);
    });
}

// Handle book form submission
function handleBookSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('book-title').value;
    const author = document.getElementById('book-author').value;
    const category = document.getElementById('book-category').value;
    const isbn = document.getElementById('book-isbn').value;
    const published = document.getElementById('book-published').value;
    
    if (currentBookId) {
        // Edit existing book
        const bookIndex = books.findIndex(book => book.id === currentBookId);
        if (bookIndex !== -1) {
            books[bookIndex] = {
                ...books[bookIndex],
                title,
                author,
                category,
                isbn,
                published: parseInt(published)
            };
        }
    } else {
        // Add new book
        const newBook = {
            id: Date.now(),
            title,
            author,
            category,
            isbn,
            published: parseInt(published),
            status: 'available'
        };
        
        books.push(newBook);
    }
    
    // Save to localStorage and re-render
    saveBooks();
    renderBooks();
    closeAllModals();
}

// Handle borrow form submission
function handleBorrowSubmit(e) {
    e.preventDefault();
    
    const borrowerName = document.getElementById('borrower-name').value;
    const borrowDate = document.getElementById('borrow-date').value;
    const returnDate = document.getElementById('return-date').value;
    
    // Update book status
    const bookIndex = books.findIndex(book => book.id === currentBookId);
    if (bookIndex !== -1) {
        books[bookIndex] = {
            ...books[bookIndex],
            status: 'borrowed',
            borrower: borrowerName,
            borrowDate,
            returnDate
        };
    }
    
    // Add to history
    const book = books.find(book => book.id === currentBookId);
    const historyItem = {
        id: Date.now(),
        bookId: currentBookId,
        bookTitle: book.title,
        borrower: borrowerName,
        borrowDate,
        returnDate,
        returned: false
    };
    
    history.unshift(historyItem);
    
    // Save to localStorage and re-render
    saveBooks();
    saveHistory();
    renderBooks();
    renderHistory();
    closeAllModals();
}

// Return a borrowed book
function returnBook(bookId) {
    // Update book status
    const bookIndex = books.findIndex(book => book.id === bookId);
    if (bookIndex !== -1) {
        books[bookIndex] = {
            ...books[bookIndex],
            status: 'available',
            borrower: null,
            borrowDate: null,
            returnDate: null
        };
    }
    
    // Update history
    const historyIndex = history.findIndex(item => item.bookId === bookId && !item.returned);
    if (historyIndex !== -1) {
        history[historyIndex] = {
            ...history[historyIndex],
            returned: true,
            returnedDate: new Date().toISOString().split('T')[0]
        };
    }
    
    // Save to localStorage and re-render
    saveBooks();
    saveHistory();
    renderBooks();
    renderHistory();
}

// Open modal
function openModal(modal) {
    closeAllModals();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close all modals
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = 'auto';
}

// Save books to localStorage
function saveBooks() {
    localStorage.setItem('books', JSON.stringify(books));
}

// Save history to localStorage
function saveHistory() {
    localStorage.setItem('history', JSON.stringify(history));
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
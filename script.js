document.addEventListener('DOMContentLoaded', function() {
    // 1. Ambil semua elemen yang dibutuhkan
    const filterButtons = document.querySelectorAll('.filter-btn');
    const filterItems = document.querySelectorAll('.filter-item');

    // 2. Tambahkan event listener untuk setiap tombol
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // A. Hapus status aktif dari semua tombol
            filterButtons.forEach(btn => {
                btn.setAttribute('aria-pressed', 'false');
                // Opsional: Hapus class active visual jika ada custom class
            });

            // B. Set status aktif ke tombol yang diklik
            button.setAttribute('aria-pressed', 'true');

            // C. Ambil kategori data dari tombol yang diklik
            const filterValue = button.getAttribute('data-filter');

            // D. Logika Filtering
            filterItems.forEach(item => {
                if (filterValue === 'all' || item.classList.contains(filterValue)) {
                    // Tampilkan item (kembalikan ke display flex/block bawaan CSS)
                    item.style.display = ''; 
                    item.classList.remove('hide');
                } else {
                    // Sembunyikan item
                    item.style.display = 'none';
                    item.classList.add('hide');
                }
            });
        });
    });
});
// Hàm hiển thị thông báo tạm thời
function showToast(message, duration = 2000) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = '#333';
    toast.style.color = 'white';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '4px';
    toast.style.zIndex = '1000';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    
    document.body.appendChild(toast);
    
    // Trigger reflow
    toast.offsetHeight;
    
    toast.style.opacity = '1';
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, duration);
}

document.addEventListener('DOMContentLoaded', () => {
    const formGenerate = document.getElementById('form-generate-qr');
    const canvas = document.getElementById('qr-canvas');
    const ctx = canvas.getContext('2d');
    const inputText = document.getElementById('input-text');
    const inputSize = document.getElementById('input-size');
    const inputColor = document.getElementById('input-color');
    const inputLogo = document.getElementById('input-logo');

    const formScan = document.getElementById('form-scan-qr');
    const inputQRFile = document.getElementById('input-qr-file');

    // Clear canvas helper
    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Draw logo image on QR code canvas centered and scaled max 100x100 px
    function drawLogo(logoImg) {
        const maxLogoSize = 100;
        let logoWidth = logoImg.width;
        let logoHeight = logoImg.height;

        // Scale logo to max 100x100 px preserving aspect ratio
        if (logoWidth > maxLogoSize || logoHeight > maxLogoSize) {
            const scale = Math.min(maxLogoSize / logoWidth, maxLogoSize / logoHeight);
            logoWidth = logoWidth * scale;
            logoHeight = logoHeight * scale;
        }

        const x = (canvas.width - logoWidth) / 2;
        const y = (canvas.height - logoHeight) / 2;
        ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);
    }

    // Generate QR code with options and optional logo
    async function generateQRCode(text, size, color, logoFile) {
        clearCanvas();
        canvas.width = size;
        canvas.height = size;

        try {
            // Generate QR code on canvas
            await QRCode.toCanvas(canvas, text, {
                width: size,
                color: {
                    dark: color,
                    light: '#ffffff'
                },
                errorCorrectionLevel: 'H'
            });

            if (logoFile) {
                const img = new Image();
                img.onload = () => {
                    drawLogo(img);
                };
                img.onerror = () => {
                    // Logo load error silently ignored
                };
                img.src = URL.createObjectURL(logoFile);
            }
        } catch (err) {
            alert('Lỗi khi tạo mã QR: ' + err.message);
        }
    }

    formGenerate.addEventListener('submit', e => {
        e.preventDefault();
        const text = inputText.value.trim();
        if (!text) {
            alert('Vui lòng nhập văn bản để tạo mã QR.');
            inputText.focus();
            return;
        }
        let size = parseInt(inputSize.value, 10);
        if (isNaN(size) || size < 100 || size > 1000) {
            alert('Kích thước mã QR phải từ 100 đến 1000 px.');
            inputSize.focus();
            return;
        }
        const color = inputColor.value || '#000000';
        const logoFile = inputLogo.files[0] || null;

        generateQRCode(text, size, color, logoFile);
    });

    // Sao chép văn bản từ textarea
    const copyTextBtn = document.getElementById('copy-text-btn');
    const outputText = document.getElementById('output-text');
    
    copyTextBtn.addEventListener('click', async () => {
        if (!outputText.value.trim()) {
            showToast('Không có nội dung để sao chép');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(outputText.value);
            copyTextBtn.classList.add('copied');
            copyTextBtn.innerHTML = '<span class="copy-icon">✓</span><span class="copy-text">Đã sao chép</span>';
            showToast('Đã sao chép vào clipboard');
            
            setTimeout(() => {
                copyTextBtn.classList.remove('copied');
                copyTextBtn.innerHTML = '<span class="copy-icon">📋</span><span class="copy-text">Sao chép</span>';
            }, 2000);
        } catch (err) {
            console.error('Lỗi khi sao chép: ', err);
            showToast('Lỗi khi sao chép');
        }
    });
    
    // Sao chép ảnh QR
    const copyQrBtn = document.getElementById('copy-qr-btn');
    const qrCanvas = document.getElementById('qr-canvas');
    
    copyQrBtn.addEventListener('click', async () => {
        if (qrCanvas.width === 0 || qrCanvas.height === 0) {
            showToast('Không có mã QR để sao chép');
            return;
        }
        
        try {
            // Chuyển canvas thành blob
            qrCanvas.toBlob(async (blob) => {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    
                    copyQrBtn.classList.add('copied');
                    copyQrBtn.innerHTML = '<span class="copy-icon">✓</span><span class="copy-text">Đã sao chép</span>';
                    showToast('Đã sao chép ảnh QR vào clipboard');
                    
                    setTimeout(() => {
                        copyQrBtn.classList.remove('copied');
                        copyQrBtn.innerHTML = '<span class="copy-icon">📋</span><span class="copy-text">Sao chép</span>';
                    }, 2000);
                } catch (err) {
                    console.error('Lỗi khi sao chép ảnh: ', err);
                    showToast('Lỗi khi sao chép ảnh');
                }
            }, 'image/png');
        } catch (err) {
            console.error('Lỗi khi tạo ảnh: ', err);
            showToast('Lỗi khi tạo ảnh để sao chép');
        }
    });
    
    // QR code scanning from image file
    formScan.addEventListener('submit', e => {
        e.preventDefault();
        outputText.value = '';
        const file = inputQRFile.files[0];
        if (!file) {
            alert('Vui lòng chọn ảnh chứa mã QR để quét.');
            inputQRFile.focus();
            return;
        }
        if (!file.type.startsWith('image/')) {
            alert('File chọn phải là ảnh.');
            inputQRFile.focus();
            return;
        }

        const reader = new FileReader();
        reader.onload = function (event) {
            const img = new Image();
            img.onload = () => {
                // Create offscreen canvas to draw image for scanning
                const offCanvas = document.createElement('canvas');
                const offCtx = offCanvas.getContext('2d');
                offCanvas.width = img.width;
                offCanvas.height = img.height;
                offCtx.drawImage(img, 0, 0);

                const imageData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: 'attemptBoth'
                });

                if (code) {
                    outputText.value = code.data;
                } else {
                    outputText.value = 'Không tìm thấy mã QR hợp lệ trong ảnh.';
                }
            };
            img.onerror = () => {
                outputText.value = 'Lỗi khi tải ảnh. Vui lòng thử lại.';
            };
            img.src = event.target.result;
        };
        reader.onerror = () => {
            outputText.value = 'Lỗi khi đọc file. Vui lòng thử lại.';
        };
        reader.readAsDataURL(file);
    });
});

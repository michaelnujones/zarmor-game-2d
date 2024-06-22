const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const player1Image = new Image();
player1Image.src = 'player1.png';

const player2Image = new Image();
player2Image.src = 'player2.png';

const groundHeight = 50;
const groundY = canvas.height - groundHeight;

const player1 = {
    x: 50,
    y: groundY - 50,
    width: 50,
    height: 50,
    image: player1Image,
    health: 100,
    maxHealth: 100,
    speed: 3,
    fireCooldown: 0,
    gravity: 0,
    isJumping: false,
    facingRight: true
};

const player2 = {
    x: 700,
    y: groundY - 50,
    width: 50,
    height: 50,
    image: player2Image,
    health: 100,
    maxHealth: 100,
    speed: 5,
    gravity: 0,
    isJumping: false,
    facingRight: false
};

const fireballs = [];
let botStartDelay = 50; // Jeda sebelum bot mulai menembak

const player1Info = document.getElementById('player1Info');
const player1HealthBar = document.getElementById('player1Health');
const player2Info = document.getElementById('player2Info');
const player2HealthBar = document.getElementById('player2Health');
const gameOverMessage = document.getElementById('gameOverMessage');
const gameOverText = document.getElementById('gameOverText');

const backgroundSound = new Audio('bc.mp3');
const shootSound = new Audio('shoot.mp3');
const hitSound = new Audio('uh.mp3');

backgroundSound.loop = true;
backgroundSound.volume = 0.3;
backgroundSound.play();

let isLeftPressed = false;
let isRightPressed = false;

// Efek salju
const snowflakes = [];

// Definisi snowflake
function Snowflake(x, y, radius, speed) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.speed = speed;
}

function createSnowfall() {
    const x = Math.random() * canvas.width;
    const y = Math.random() * -canvas.height; // Salju dimulai dari atas canvas
    const radius = Math.random() * 2 + 1; // Ukuran salju bervariasi
    const speed = Math.random() * 2 + 1; // Kecepatan jatuh bervariasi
    snowflakes.push(new Snowflake(x, y, radius, speed));
}

function drawSnowfall() {
    ctx.fillStyle = 'white';
    snowflakes.forEach(snowflake => {
        ctx.beginPath();
        ctx.arc(snowflake.x, snowflake.y, snowflake.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

function updateSnowfall() {
    snowflakes.forEach((snowflake, index) => {
        snowflake.y += snowflake.speed;
        // Jika salju jatuh melewati bawah canvas, hilangkan dari array
        if (snowflake.y > canvas.height) {
            snowflakes.splice(index, 1);
        }
    });
}

function drawGround() {
    ctx.fillStyle = 'green';
    ctx.fillRect(0, groundY, canvas.width, groundHeight);
}

function drawPlayer(player) {
    ctx.save();
    if (!player.facingRight) {
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        ctx.scale(-1, 1);
        ctx.translate(-player.x - player.width / 2, -player.y - player.height / 2);
    }
    ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
    ctx.restore();
}

function drawFireballs() {
    ctx.fillStyle = 'orange';
    fireballs.forEach(fireball => {
        ctx.beginPath();
        ctx.arc(fireball.x, fireball.y, fireball.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

function updateFireballs() {
    fireballs.forEach((fireball, index) => {
        fireball.x += fireball.speed;
        if (fireball.x > canvas.width || fireball.x < 0) {
            fireballs.splice(index, 1); // Remove fireball if it goes off screen
        }
        // Check collision with player2
        if (fireball.x > player2.x && fireball.x < player2.x + player2.width &&
            fireball.y > player2.y && fireball.y < player2.y + player2.height) {
            player2.health -= 17;
            hitSound.currentTime = 0;
            hitSound.play();
            if (player2.health <= 0) {
                endGame("Player 1"); // Panggil fungsi endGame jika player 2 mati
            }
            fireballs.splice(index, 1); // Remove fireball upon collision
        }
        // Check collision with player1 (bot)
        if (fireball.x > player1.x && fireball.x < player1.x + player1.width &&
            fireball.y > player1.y && fireball.y < player1.y + player1.height) {
            // Bot harus mengelak di sini
            if (Math.random() < 0.7) { // Misalnya, bot punya 70% kemungkinan untuk mengelak
                player1.isJumping = true;
                player1.gravity = -10; // Atur kecepatan lompatannya
            }
            // Kurangi health bot
            player1.health -= 4;
            hitSound.currentTime = 0;
            hitSound.play();
            if (player1.health <= 0) {
                endGame("Player 2"); // Panggil fungsi endGame jika bot mati
            }
            fireballs.splice(index, 1); // Remove fireball upon collision
        }
    });
}

function applyGravity(player) {
    if (player.isJumping) {
        player.gravity += 0.5; // Acceleration due to gravity
        player.y += player.gravity;
        if (player.y >= groundY - player.height) {
            player.y = groundY - player.height;
            player.isJumping = false;
            player.gravity = 0;
        }
    }
}

function botBehavior() {
    if (botStartDelay > 0) {
        botStartDelay--;
        return;
    }

    // Make the bot jump periodically
    if (!player1.isJumping && Math.random() < 0.01) {
        player1.isJumping = true;
        player1.gravity = -10;
    }

    // Check if there are fireballs incoming towards player1
    fireballs.forEach(fireball => {
        if (fireball.speed < 0 && fireball.x < player1.x + player1.width && fireball.x > player1.x) {
            if (Math.random() < 0.5) { // Misalnya, bot punya 50% kemungkinan untuk mengelak
                player1.isJumping = true;
                player1.gravity = -10; // Atur kecepatan lompatannya
            }
        }
        if (fireball.speed > 0 && fireball.x > player1.x && fireball.x < player1.x + player1.width) {
            if (Math.random() < 0.5) { // Misalnya, bot punya 50% kemungkinan untuk mengelak
                player1.isJumping = true;
                player1.gravity = -10; // Atur kecepatan lompatannya
            }
        }
    });

    // Increase shooting frequency (sudah ada)
    if (player1.fireCooldown <= 0) {
        fireballs.push({
            x: player1.facingRight ? player1.x + player1.width : player1.x,
            y: player1.y + player1.height / 2,
            radius: 5,
            speed: player1.facingRight ? 7 : -7
        });
        player1.fireCooldown = 50; // Reduce cooldown for more frequent shooting
        shootSound.currentTime = 0;
        shootSound.play();
    } else {
        player1.fireCooldown--;
    }

    // Enhanced bot movement: move back and forth within a range (sudah ada)
    player1.x += player1.speed;
    if (player1.x <= 0 || player1.x >= canvas.width - player1.width) {
        player1.speed *= -1; // Change direction upon reaching canvas bounds
        player1.facingRight = !player1.facingRight; // Change facing direction
    }
}

function updateHealthBars() {
    const player1HealthWidth = (player1.health / player1.maxHealth) * 100 + '%';
    const player2HealthWidth = (player2.health / player2.maxHealth) * 100 + '%';

    player1HealthBar.style.width = player1HealthWidth;
    player2HealthBar.style.width = player2HealthWidth;
}

function endGame(winner) {
    gameOverText.textContent = `${winner} wins! Game Over!`;
    gameOverMessage.style.display = 'block';
    // Stop the game loop
    cancelAnimationFrame(update);
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGround();
    drawPlayer(player1);
    drawPlayer(player2);
    drawFireballs();
    drawSnowfall(); // Gambar salju setiap frame
    updateFireballs();
    updateSnowfall(); // Perbarui posisi salju setiap frame
    applyGravity(player1);
    applyGravity(player2);
    botBehavior();
    updateHealthBars();

    if (isLeftPressed) {
        player2.x -= player2.speed;
        player2.facingRight = false;
    }
    if (isRightPressed) {
        player2.x += player2.speed;
        player2.facingRight = true;
    }

    requestAnimationFrame(update);
}

// Event listeners for keyboard controls
document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'a':
            isLeftPressed = true;
            break;
        case 'd':
            isRightPressed = true;
            break;
        case 'w':
            if (!player2.isJumping) {
                player2.isJumping = true;
                player2.gravity = -10;
            }
            break;
        case ' ':
            fireballs.push({
                x: player2.facingRight ? player2.x + player2.width : player2.x,
                y: player2.y + player2.height / 2,
                radius: 5,
                speed: player2.facingRight ? 7 : -7
            });
            shootSound.currentTime = 0;
            shootSound.play();
            break;
    }
    // Prevent players from moving below the ground
    player2.y = Math.min(player2.y, groundY - player2.height);
});

document.addEventListener('keyup', (e) => {
    switch (e.key) {
        case 'a':
            isLeftPressed = false;
            break;
        case 'd':
            isRightPressed = false;
            break;
    }
});

// Event listeners for touch controls
document.getElementById('leftBtn').addEventListener('touchstart', () => {
    isLeftPressed = true;
});

document.getElementById('leftBtn').addEventListener('touchend', () => {
    isLeftPressed = false;
});

document.getElementById('rightBtn').addEventListener('touchstart', () => {
    isRightPressed = true;
});

document.getElementById('rightBtn').addEventListener('touchend', () => {
    isRightPressed = false;
});

document.getElementById('jumpBtn').addEventListener('touchstart', () => {
    if (!player2.isJumping) {
        player2.isJumping = true;
        player2.gravity = -10;
    }
});

document.getElementById('fireBtn').addEventListener('touchstart', () => {
    fireballs.push({
        x: player2.facingRight ? player2.x + player2.width : player2.x,
        y: player2.y + player2.height / 2,
        radius: 5,
        speed: player2.facingRight ? 7 : -7
    });
    shootSound.currentTime = 0;
    shootSound.play();
});

// Memulai efek salju
setInterval(createSnowfall, 100); // Mengatur kepadatan salju

// Memulai game loop
update();

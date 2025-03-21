class ScoundrelUI {
    constructor() {
        this.level = 1;
        this.lives = 3;
        this.highestLevelReached = 1;
        this.startingDeckSize = 0;
        this.highScores = this.loadHighScores();
        this.initializeGame();
    }

    initializeGame() {
        this.game = new ScoundrelGame(this.level);
        this.game.initializeDeck();
        this.startingDeckSize = this.game.dungeon.length;
        this.cardsHandledThisTurn = 0;
        this.mustClearNextRoom = false;
        
        this.setupEventListeners();
        this.updateLevelDisplay();
        this.updateLivesDisplay();
        this.updateRulesForLevel();
        this.startNewTurn();
    }

    setupEventListeners() {
        // Desktop avoid button
        document.getElementById('avoidRoom').addEventListener('click', () => this.handleAvoidRoom());
        
        // Mobile avoid button - use the SAME handleAvoidRoom function
        const mobileAvoidButton = document.getElementById('avoidRoom-mobile');
        if (mobileAvoidButton) {
            mobileAvoidButton.addEventListener('click', () => this.handleAvoidRoom());
        }
    }

    startNewTurn() {
        this.cardsHandledThisTurn = 0;
        if (this.cardsHandledThisTurn === 3) {
            this.mustClearNextRoom = false;
        }
        this.game.startTurn();
        this.updateUI();
    }

    updateUI() {
        this.updateHealth();
        this.updateDungeonCount();
        this.updateRoom();
        this.updateWeapon();
        this.updateAvoidButton();
        this.updateLevelDisplay();
        this.updateLivesDisplay();
        this.updateHighScores();
        this.updateRulesForLevel();
        this.checkGameOver();
        this.updateMobileUI();
        this.syncMobileUI();
    }

    updateHealth() {
        const healthElement = document.getElementById('health');
        const healthBar = document.getElementById('healthBar');
        healthElement.textContent = this.game.health;
        
        // Update health bar
        const healthPercentage = (this.game.health / this.game.maxHealth) * 100;
        healthBar.style.width = `${healthPercentage}%`;
        
        // Change color based on health percentage
        if (healthPercentage <= 25) {
            healthBar.style.background = '#ff4444';
        } else if (healthPercentage <= 50) {
            healthBar.style.background = '#ffbb33';
        } else {
            healthBar.style.background = '#00C851';
        }
    }

    updateDungeonCount() {
        document.getElementById('dungeonCount').textContent = this.game.dungeon.length;
    }

    updateRoom() {
        const roomElement = document.getElementById('room');
        roomElement.innerHTML = '';

        console.log("Cards in room:", this.game.room.length);
        
        if (this.game.room.length === 0) {
            roomElement.innerHTML = '<div style="color:white;text-align:center;padding:20px;">Loading cards...</div>';
            return;
        }

        this.game.room.forEach((card, index) => {
            const cardElement = this.createCardElement(card, index);
            roomElement.appendChild(cardElement);
        });
        
        // No need for setTimeout or extra styling - let the cards render normally
    }

    createCardElement(card, index) {
        const div = document.createElement('div');
        div.className = `card ${card.suit}`;
        
        // Always use the beautiful original SVG cards
        div.innerHTML = this.createCardSVG(card);
        
        div.addEventListener('click', () => this.handleCardClick(index));
        return div;
    }

    createCardSVG(card) {
        const suitSymbols = {
            'hearts': '♥',
            'diamonds': '♦',
            'clubs': '♣',
            'spades': '♠'
        };

        const suitColors = {
            'hearts': '#ff0000',
            'diamonds': '#ff0000',
            'clubs': '#000000',
            'spades': '#000000'
        };

        // Base card SVG with decorative border and background pattern
        let svg = `
            <svg width="100%" height="100%" viewBox="0 0 120 190">
                <!-- Card background with pattern -->
                <defs>
                    <pattern id="cardPattern_${card.suit}_${card.value}" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M0 0L10 10M10 0L0 10" stroke="#f0f0f0" stroke-width="0.5"/>
                    </pattern>
                </defs>
                
                <!-- Card base with shadow -->
                <rect x="2" y="2" width="116" height="186" rx="10" ry="10" fill="#000" opacity="0.1"/>
                <rect x="0" y="0" width="116" height="186" rx="10" ry="10" 
                      fill="white" stroke="#000" stroke-width="2"/>
                <rect x="4" y="4" width="108" height="178" rx="8" ry="8" 
                      fill="url(#cardPattern_${card.suit}_${card.value})"/>
                
                <!-- Decorative border -->
                <rect x="8" y="8" width="100" height="170" rx="6" ry="6" 
                      fill="none" stroke="${suitColors[card.suit]}" stroke-width="1"/>

                <!-- Top left value and suit -->
                <text x="15" y="30" font-family="Arial" font-weight="bold" 
                      font-size="22" fill="${suitColors[card.suit]}">${card.value}</text>
                <text x="15" y="52" font-family="Arial" font-size="22" 
                      fill="${suitColors[card.suit]}">${suitSymbols[card.suit]}</text>
                
                <!-- Bottom right value and suit (positioned properly) -->
                <g transform="translate(120, 190) rotate(180)">
                    <text x="15" y="30" font-family="Arial" font-weight="bold" 
                          font-size="22" fill="${suitColors[card.suit]}">${card.value}</text>
                    <text x="15" y="52" font-family="Arial" font-size="22" 
                          fill="${suitColors[card.suit]}">${suitSymbols[card.suit]}</text>
                </g>`;

        // Add specific card content based on type
        if (!isNaN(card.numericValue) && card.numericValue >= 2 && card.numericValue <= 10) {
            svg += this.createNumberCardPattern(card, suitSymbols, suitColors);
        } else if (card.value === 'J' || card.value === 'Q' || card.value === 'K') {
            svg += this.createFaceCardDesign(card, suitColors);
        } else if (card.value === 'A') {
            svg += this.createAceDesign(card, suitSymbols, suitColors);
        }

        svg += '</svg>';
        return svg;
    }

    createNumberCardPattern(card, suitSymbols, suitColors) {
        const suitSymbol = suitSymbols[card.suit];
        let pattern = '';
        const positions = this.getSymbolPositions(card.numericValue);
        
        positions.forEach(pos => {
            pattern += `
                <text x="${pos.x}" y="${pos.y}" font-size="24" text-anchor="middle" 
                      fill="${suitColors[card.suit]}">${suitSymbol}</text>
            `;
        });

        return pattern;
    }

    getSymbolPositions(number) {
        // Adjusted positions for larger cards
        const patterns = {
            2: [{x: 60, y: 65}, {x: 60, y: 125}],
            3: [{x: 60, y: 65}, {x: 60, y: 95}, {x: 60, y: 125}],
            4: [{x: 40, y: 65}, {x: 80, y: 65}, {x: 40, y: 125}, {x: 80, y: 125}],
            5: [{x: 40, y: 65}, {x: 80, y: 65}, {x: 60, y: 95}, {x: 40, y: 125}, {x: 80, y: 125}],
            6: [{x: 40, y: 65}, {x: 80, y: 65}, {x: 40, y: 95}, {x: 80, y: 95}, {x: 40, y: 125}, {x: 80, y: 125}],
            7: [{x: 40, y: 65}, {x: 80, y: 65}, {x: 60, y: 80}, {x: 40, y: 110}, {x: 80, y: 110}, {x: 40, y: 130}, {x: 80, y: 130}],
            8: [{x: 40, y: 55}, {x: 80, y: 55}, {x: 40, y: 80}, {x: 80, y: 80}, {x: 40, y: 110}, {x: 80, y: 110}, {x: 40, y: 135}, {x: 80, y: 135}],
            9: [{x: 40, y: 55}, {x: 60, y: 55}, {x: 80, y: 55}, {x: 40, y: 95}, {x: 60, y: 95}, {x: 80, y: 95}, {x: 40, y: 135}, {x: 60, y: 135}, {x: 80, y: 135}],
            10: [{x: 40, y: 55}, {x: 80, y: 55}, {x: 60, y: 70}, {x: 40, y: 85}, {x: 80, y: 85}, {x: 40, y: 105}, {x: 80, y: 105}, {x: 60, y: 120}, {x: 40, y: 135}, {x: 80, y: 135}]
        };
        return patterns[number] || [];
    }

    createFaceCardDesign(card, suitColors) {
        // Add blacksmith designs for diamond face cards
        if (card.suit === 'diamonds') {
            const designs = {
                'J': `
                    <rect x="30" y="60" width="60" height="70" fill="${suitColors[card.suit]}" opacity="0.2"/>
                    <text x="60" y="95" font-size="14" text-anchor="middle" fill="${suitColors[card.suit]}">BLACKSMITH</text>
                    <text x="60" y="115" font-size="12" text-anchor="middle" fill="${suitColors[card.suit]}">Remove 1</text>
                    <text x="60" y="130" font-size="12" text-anchor="middle" fill="${suitColors[card.suit]}">Monster</text>
                `,
                'Q': `
                    <rect x="30" y="60" width="60" height="70" fill="${suitColors[card.suit]}" opacity="0.2"/>
                    <text x="60" y="95" font-size="14" text-anchor="middle" fill="${suitColors[card.suit]}">BLACKSMITH</text>
                    <text x="60" y="115" font-size="12" text-anchor="middle" fill="${suitColors[card.suit]}">Remove 2</text>
                    <text x="60" y="130" font-size="12" text-anchor="middle" fill="${suitColors[card.suit]}">Monsters</text>
                `,
                'K': `
                    <rect x="30" y="60" width="60" height="70" fill="${suitColors[card.suit]}" opacity="0.2"/>
                    <text x="60" y="95" font-size="14" text-anchor="middle" fill="${suitColors[card.suit]}">BLACKSMITH</text>
                    <text x="60" y="115" font-size="12" text-anchor="middle" fill="${suitColors[card.suit]}">Remove 3</text>
                    <text x="60" y="130" font-size="12" text-anchor="middle" fill="${suitColors[card.suit]}">Monsters</text>
                `
            };
            return designs[card.value] || '';
        }

        // Original face card designs for other suits
        const designs = {
            'J': `
                <rect x="30" y="60" width="60" height="70" fill="${suitColors[card.suit]}" opacity="0.2"/>
                <text x="60" y="110" font-size="46" text-anchor="middle" fill="${suitColors[card.suit]}">J</text>
            `,
            'Q': `
                <path d="M60 60 Q85 95 60 130" stroke="${suitColors[card.suit]}" fill="none" stroke-width="2"/>
                <text x="60" y="110" font-size="46" text-anchor="middle" fill="${suitColors[card.suit]}">Q</text>
            `,
            'K': `
                <path d="M45 60 L45 130 M45 95 L75 60 M45 95 L75 130" 
                      stroke="${suitColors[card.suit]}" fill="none" stroke-width="2"/>
                <text x="60" y="110" font-size="46" text-anchor="middle" fill="${suitColors[card.suit]}">K</text>
            `
        };
        return designs[card.value] || '';
    }

    createAceDesign(card, suitSymbols, suitColors) {
        const suitSymbol = suitSymbols[card.suit];
        return `
            <text x="60" y="110" font-size="70" text-anchor="middle" 
                  fill="${suitColors[card.suit]}">${suitSymbol}</text>
            <text x="60" y="140" font-size="22" text-anchor="middle" 
                  fill="${suitColors[card.suit]}">ACE</text>
        `;
    }

    updateWeapon() {
        // Update equipped weapon containers
        const equippedWeapon = this.game.equippedWeapon ? 
            this.createCardElement(this.game.equippedWeapon).outerHTML : 
            'No weapon equipped';
        
        document.getElementById('equippedWeapon').innerHTML = equippedWeapon;
        
        // Update monster containers
        const monstersHTML = this.game.monstersOnWeapon
            .map(monster => this.createCardElement(monster).outerHTML)
            .join('');
        
        document.getElementById('monstersOnWeapon').innerHTML = monstersHTML;
        
        // Also update mobile versions if they exist
        const mobileEquippedElement = document.getElementById('mobileEquippedWeapon');
        const mobileMonstersElement = document.getElementById('mobileMonstersOnWeapon');
        
        if (mobileEquippedElement) mobileEquippedElement.innerHTML = equippedWeapon;
        if (mobileMonstersElement) mobileMonstersElement.innerHTML = monstersHTML;
    }

    updateAvoidButton() {
        const canAvoid = this.game.canAvoidRoom && this.cardsHandledThisTurn === 0;
        
        // Update desktop button
        const avoidButton = document.getElementById('avoidRoom');
        if (avoidButton) {
            avoidButton.disabled = !canAvoid;
            avoidButton.style.opacity = canAvoid ? '1' : '0.5';
            avoidButton.style.cursor = canAvoid ? 'pointer' : 'not-allowed';
            
            // Show tooltip explaining why button is disabled
            if (this.game.avoidedLastRoom) {
                avoidButton.title = "Cannot avoid two rooms in a row";
            } else if (this.cardsHandledThisTurn > 0) {
                avoidButton.title = "Cannot avoid room after handling cards";
            } else {
                avoidButton.title = "Avoid this room (costs 1 action)";
            }
        }
        
        // Update mobile button with the SAME logic
        const mobileAvoidButton = document.getElementById('avoidRoom-mobile');
        if (mobileAvoidButton) {
            mobileAvoidButton.disabled = !canAvoid;
            mobileAvoidButton.style.opacity = canAvoid ? '1' : '0.5';
            mobileAvoidButton.style.cursor = canAvoid ? 'pointer' : 'not-allowed';
            
            // Same tooltip for mobile
            if (this.game.avoidedLastRoom) {
                mobileAvoidButton.title = "Cannot avoid two rooms in a row";
            } else if (this.cardsHandledThisTurn > 0) {
                mobileAvoidButton.title = "Cannot avoid room after handling cards";
            } else {
                mobileAvoidButton.title = "Avoid this room (costs 1 action)";
            }
        }
    }

    handleCardClick(index) {
        if (this.cardsHandledThisTurn >= 3) {
            this.showMessage("You've already handled 3 cards this turn!");
            return;
        }

        try {
            this.game.handleCard(index);
            this.cardsHandledThisTurn++;
            // Update the game counter too
            this.game.cardsHandledInRoom = this.cardsHandledThisTurn;
            this.updateUI();

            // Check if we need to start a new turn - FIXED conditions
            if (this.cardsHandledThisTurn >= 3 || this.game.room.length === 0) {
                console.log("Starting new turn because handled cards =", this.cardsHandledThisTurn, "or room length =", this.game.room.length);
                this.mustClearNextRoom = false;
                setTimeout(() => this.startNewTurn(), 1000);
            }
        } catch (error) {
            this.showMessage(error.message);
        }
    }

    handleAvoidRoom() {
        try {
            this.game.avoidRoom();
            this.mustClearNextRoom = true;
            this.startNewTurn();
        } catch (error) {
            this.showMessage(error.message);
        }
    }

    showMessage(message) {
        const messagesElement = document.getElementById('gameMessages');
        messagesElement.textContent = message;
        
        // Add special styling for blacksmith messages
        if (message.includes('blacksmith') || message.includes('monster')) {
            messagesElement.style.color = '#ff6b6b';
            messagesElement.style.fontWeight = 'bold';
        } else {
            messagesElement.style.color = '#ff4444';
            messagesElement.style.fontWeight = 'normal';
        }
        
        setTimeout(() => {
            messagesElement.textContent = '';
            messagesElement.style.color = '#ff4444';
            messagesElement.style.fontWeight = 'normal';
        }, 3000);
    }

    updateLevelDisplay() {
        document.getElementById('currentLevel').textContent = this.level;
    }

    updateLivesDisplay() {
        const livesElement = document.getElementById('livesRemaining');
        if (livesElement) {
            livesElement.textContent = this.lives;
            
            // Change color based on lives remaining
            if (this.lives === 1) {
                livesElement.style.color = '#ff4444'; // Red for 1 life
            } else if (this.lives === 2) {
                livesElement.style.color = '#ffbb33'; // Yellow for 2 lives
            } else {
                livesElement.style.color = '#00C851'; // Green for 3 lives
            }
        }
    }

    loadHighScores() {
        const scores = localStorage.getItem('scoundrelHighScores');
        return scores ? JSON.parse(scores) : [];
    }

    saveHighScore(level, cardsDiscarded) {
        if (level < this.highestLevelReached) {
            return false;
        }

        const score = {
            level,
            cardsDiscarded,
            timestamp: Date.now()
        };

        this.highScores.push(score);
        
        this.highScores.sort((a, b) => {
            if (a.level !== b.level) {
                return b.level - a.level;
            }
            return b.cardsDiscarded - a.cardsDiscarded;
        });

        this.highScores = this.highScores.slice(0, 10);

        localStorage.setItem('scoundrelHighScores', JSON.stringify(this.highScores));

        return this.highScores.includes(score);
    }

    updateHighScores() {
        const scoresContainer = document.getElementById('highScores');
        scoresContainer.innerHTML = '';

        this.highScores.forEach((score, index) => {
            const scoreElement = document.createElement('div');
            scoreElement.className = 'score-entry';
            scoreElement.innerHTML = `
                <span>#${index + 1}</span>
                <span>L${score.level} C${score.cardsDiscarded}</span>
            `;
            scoresContainer.appendChild(scoreElement);
        });
    }

    checkGameOver() {
        if (this.game.isGameOver()) {
            const score = this.game.calculateScore();
            const cardsLeft = this.game.dungeon.length;
            const cardsDiscarded = this.startingDeckSize - cardsLeft;

            if (this.game.hasWon()) {
                if (this.level >= this.highestLevelReached) {
                    const isHighScore = this.saveHighScore(this.level, cardsDiscarded);
                    const highScoreMessage = isHighScore ? "\nNew High Score!" : "";
                    
                    alert(`Congratulations! You completed level ${this.level} with score: ${score}
                    Cards discarded: ${cardsDiscarded}${highScoreMessage}
                    Moving to level ${this.level + 1}!`);
                    
                    this.highestLevelReached = Math.max(this.highestLevelReached, this.level);
                } else {
                    alert(`Congratulations! You completed level ${this.level} with score: ${score}
                    Cards discarded: ${cardsDiscarded}
                    Moving to level ${this.level + 1}!`);
                }
                
                this.lives = 3;
                this.level++;
                this.initializeGame();
            } else if (this.game.health <= 0) {
                this.lives--;
                
                if (this.lives > 0) {
                    alert(`You lost a life! Lives remaining: ${this.lives}
                    Restarting level ${this.level}...`);
                    this.initializeGame();
                } else {
                    if (this.level >= this.highestLevelReached) {
                        const isHighScore = this.saveHighScore(this.level, cardsDiscarded);
                        const highScoreMessage = isHighScore ? "\nNew High Score!" : "";
                        
                        alert(`Game Over! You're out of lives.
                        Final Level: ${this.level}
                        Cards discarded: ${cardsDiscarded}${highScoreMessage}`);
                        
                        this.highestLevelReached = Math.max(this.highestLevelReached, this.level);
                    } else {
                        alert(`Game Over! You're out of lives.
                        Final Level: ${this.level}
                        Cards discarded: ${cardsDiscarded}`);
                    }
                    
                    this.level = 1;
                    this.lives = 3;
                    this.highestLevelReached = 1;
                    this.initializeGame();
                }
            }
        }
    }

    updateRulesForLevel() {
        const specialCardsElement = document.getElementById('specialCards');
        specialCardsElement.innerHTML = '';
        
        // Base rules for all levels
        let specialCards = [];
        
        // Add special cards based on level
        if (this.level >= 2) {
            specialCards.push({
                name: 'J♦',
                desc: 'Blacksmith - Removes 1 monster from weapon'
            });
        }
        
        if (this.level >= 3) {
            specialCards.push({
                name: 'Q♦',
                desc: 'Blacksmith - Removes 2 monsters from weapon'
            });
        }
        
        if (this.level >= 4) {
            specialCards.push({
                name: 'K♦',
                desc: 'Blacksmith - Removes 3 monsters from weapon'
            });
        }
        
        // Rule about Ace value
        specialCards.push({
            name: 'A♣/♠',
            desc: `Monster with value of ${this.level} (current level)`
        });
        
        // Add all special cards to the rules panel
        if (specialCards.length === 0) {
            specialCardsElement.innerHTML = '<p>None at Level 1</p>';
        } else {
            const ul = document.createElement('ul');
            specialCards.forEach(card => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${card.name}:</strong> ${card.desc}`;
                ul.appendChild(li);
            });
            specialCardsElement.appendChild(ul);
        }
    }

    updateMobileUI() {
        // Only for mobile
        if (window.innerWidth > 768) return;
        
        // Update mobile header info
        const mobileHealth = document.getElementById('mobileHealth');
        const mobileHealthBar = document.getElementById('mobileHealthBar');
        const mobileLevel = document.getElementById('mobileLevel');
        const mobileLives = document.getElementById('mobileLives');
        const mobileDungeonCount = document.getElementById('mobileDungeonCount');
        
        if (mobileHealth) mobileHealth.textContent = this.game.health;
        if (mobileLevel) mobileLevel.textContent = this.level;
        if (mobileLives) mobileLives.textContent = this.lives;
        if (mobileDungeonCount) mobileDungeonCount.textContent = this.game.dungeon.length;
        
        // Update the mobile health bar
        if (mobileHealthBar) {
            const healthPercentage = (this.game.health / this.game.maxHealth) * 100;
            mobileHealthBar.style.width = `${healthPercentage}%`;
            
            // Change color based on health percentage
            if (healthPercentage <= 25) {
                mobileHealthBar.style.background = '#ff4444';
            } else if (healthPercentage <= 50) {
                mobileHealthBar.style.background = '#ffbb33';
            } else {
                mobileHealthBar.style.background = '#00C851';
            }
        }
        
        // Sync avoid button states
        const mainAvoidButton = document.getElementById('avoidRoom');
        const mobileAvoidButton = document.getElementById('avoidRoom-mobile');
        
        if (mobileAvoidButton && mainAvoidButton) {
            mobileAvoidButton.disabled = mainAvoidButton.disabled;
        }
    }

    syncMobileUI() {
        // Only for mobile
        if (window.innerWidth > 768) return;
        
        const health = document.getElementById('health').textContent;
        const maxHealth = document.getElementById('health').nextElementSibling.textContent;
        const level = document.getElementById('currentLevel').textContent;
        const lives = document.getElementById('livesRemaining').textContent;
        const dungeonCount = document.getElementById('dungeonCount').textContent;
        
        // Update mobile header
        document.getElementById('mobileHealth').textContent = health;
        document.getElementById('mobileLevel').textContent = level;
        document.getElementById('mobileLives').textContent = lives;
        document.getElementById('mobileDungeonCount').textContent = dungeonCount;
        
        // Update mobile health bar
        const healthPercent = (parseInt(health) / parseInt(maxHealth)) * 100;
        document.getElementById('mobileHealthBar').style.width = healthPercent + '%';
        
        // Sync avoid buttons
        const mainAvoidButton = document.getElementById('avoidRoom');
        const mobileAvoidButton = document.getElementById('avoidRoom-mobile');
        
        if (mobileAvoidButton && mainAvoidButton) {
            mobileAvoidButton.disabled = mainAvoidButton.disabled;
        }
    }

    // This should be a method of the ScoundrelUI class, not a nested function
    ensureCardDisplay() {
        // Fix any display issues for new cards
        document.querySelectorAll('.room .card').forEach(card => {
            // Make sure cards are visible and clickable
            card.style.display = '';
            card.style.opacity = '';
            card.style.pointerEvents = 'auto';
        });
    }
}

// Start a new instance when the page loads
window.addEventListener('load', () => {
    window.scoundrelUI = new ScoundrelUI();
});

// Add just this simple tab function
document.addEventListener('DOMContentLoaded', function() {
    // Only for mobile
    if (window.innerWidth > 768) return;
    
    const tabs = document.querySelectorAll('.mobile-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update tab styling
            document.querySelectorAll('.mobile-tab').forEach(t => 
                t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update content visibility
            document.querySelectorAll('.tab-content').forEach(content => 
                content.classList.remove('active'));
            
            const tabId = tab.getAttribute('data-tab') + 'Tab';
            document.getElementById(tabId).classList.add('active');
        });
    });
});
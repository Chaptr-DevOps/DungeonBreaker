class ScoundrelGame {
    constructor(level = 1) {
        this.level = level;
        this.health = 20;
        this.maxHealth = 20;
        this.dungeon = [];
        this.room = [];
        this.discard = [];
        this.equippedWeapon = null;
        this.monstersOnWeapon = [];
        this.canAvoidRoom = true;
        this.avoidedLastRoom = false;
        this.cardsHandledInRoom = 0;
        this.potionUsedThisTurn = false;
        this.deck = [];
        this.initializeDeck();
        this.shuffleDeck();
        this.dungeon = [...this.deck];
    }

    initializeDeck() {
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        
        this.deck = [];
        
        for (let suit of suits) {
            for (let value of values) {
                // Modified face card logic to include diamond face cards based on level
                if ((suit === 'hearts') && 
                    (value === 'J' || value === 'Q' || value === 'K' || value === 'A')) {
                    continue;
                }
                if (suit === 'diamonds' && value === 'A') {
                    continue;
                }
                // Add diamond face cards based on level
                if (suit === 'diamonds' && value === 'J' && this.level < 2) continue;
                if (suit === 'diamonds' && value === 'Q' && this.level < 3) continue;
                if (suit === 'diamonds' && value === 'K' && this.level < 4) continue;

                this.deck.push({
                    suit,
                    value,
                    numericValue: this.getNumericValue(value)
                });
            }
        }
    }

    getNumericValue(value) {
        const valueMap = {
            'J': 11,
            'Q': 12,
            'K': 13,
            'A': this.level  // Ace value now equals the current level
        };
        return valueMap[value] || parseInt(value);
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    getCardType(card) {
        if (card.suit === 'hearts') return 'potion';
        if (card.suit === 'diamonds') {
            if (card.value === 'J' || card.value === 'Q' || card.value === 'K') {
                return 'blacksmith';
            }
            return 'weapon';
        }
        return 'monster';
    }

    drawRoom() {
        // Keep the last card from previous room if it exists
        const lastCard = this.room.length === 1 ? this.room[0] : null;
        this.room = lastCard ? [lastCard] : [];

        // Draw until we have 4 cards
        while (this.room.length < 4 && this.dungeon.length > 0) {
            this.room.push(this.dungeon.shift());
        }

        return this.room.length === 4;
    }

    avoidRoom() {
        if (!this.canAvoidRoom) {
            throw new Error("Cannot avoid two rooms in a row");
        }
        if (this.cardsHandledInRoom > 0) {
            throw new Error("Cannot avoid room after handling cards");
        }

        // Put current room cards at bottom of dungeon
        this.dungeon.push(...this.room);
        this.room = [];
        this.canAvoidRoom = false;
        this.avoidedLastRoom = true;
    }

    handleCard(cardIndex) {
        if (cardIndex < 0 || cardIndex >= this.room.length) {
            throw new Error("Invalid card index");
        }

        const card = this.room[cardIndex];
        const cardType = this.getCardType(card);

        this.cardsHandledInRoom++;

        switch (cardType) {
            case 'potion':
                this.usePotion(card);
                break;
            case 'weapon':
                this.equipWeapon(card);
                break;
            case 'monster':
                this.fightMonster(card);
                break;
            case 'blacksmith':
                this.useBlacksmith(card);
                break;
        }

        // Remove the card from the room
        this.room.splice(cardIndex, 1);
    }

    usePotion(card) {
        // Check if we've already used a potion this turn
        if (this.potionUsedThisTurn) {
            this.discard.push(card);
            return;
        }

        // If health is already at max, no healing needed
        if (this.health >= this.maxHealth) {
            this.discard.push(card);
            return;
        }

        // Always heal up to maxHealth (20) when using a potion
        this.health = Math.min(this.maxHealth, this.health + card.numericValue);
        this.potionUsedThisTurn = true;
        this.discard.push(card);
    }

    equipWeapon(card) {
        if (this.equippedWeapon) {
            // Discard current weapon and its monsters
            this.discard.push(this.equippedWeapon, ...this.monstersOnWeapon);
        }
        
        this.equippedWeapon = card;
        this.monstersOnWeapon = [];
    }

    fightMonster(monster) {
        if (!this.canUseWeaponAgainst(monster)) {
            // Fight barehanded
            this.health -= monster.numericValue;
            this.discard.push(monster);
            return;
        }

        // Fight with weapon
        const damage = Math.max(0, monster.numericValue - this.equippedWeapon.numericValue);
        this.health -= damage;
        this.monstersOnWeapon.push(monster);
    }

    canUseWeaponAgainst(monster) {
        if (!this.equippedWeapon) return false;
        
        // If no monsters have been killed with this weapon yet, we can use it
        if (this.monstersOnWeapon.length === 0) return true;

        // Get the last monster killed with this weapon
        const lastMonster = this.monstersOnWeapon[this.monstersOnWeapon.length - 1];
        
        // Can only use weapon against monsters with lower or equal value than last killed monster
        return monster.numericValue <= lastMonster.numericValue;
    }

    useBlacksmith(card) {
        if (!this.equippedWeapon) {
            // Simply discard the blacksmith if no weapon is equipped
            this.discard.push(card);
            return; // No error thrown
        }

        if (this.monstersOnWeapon.length === 0) {
            // Simply discard the blacksmith if no monsters on weapon
            this.discard.push(card);
            return; // No error thrown
        }

        // Determine how many monsters can be removed based on the card
        let monstersToRemove = 1; // Jack
        if (card.value === 'Q') monstersToRemove = 2;
        if (card.value === 'K') monstersToRemove = 3;

        // Remove the monsters
        const removedMonsters = this.monstersOnWeapon.splice(
            Math.max(0, this.monstersOnWeapon.length - monstersToRemove), 
            monstersToRemove
        );

        // Add removed monsters and blacksmith to discard
        this.discard.push(...removedMonsters, card);
    }

    startTurn() {
        this.potionUsedThisTurn = false;
        
        // Only allow avoiding if player didn't avoid last room
        if (!this.avoidedLastRoom) {
            this.canAvoidRoom = true;
        }
        
        this.avoidedLastRoom = false;
        this.cardsHandledInRoom = 0;
        return this.drawRoom();
    }

    isGameOver() {
        return this.health <= 0 || this.dungeon.length === 0;
    }

    calculateScore() {
        if (this.health <= 0) {
            // Find remaining monsters in dungeon and subtract their values
            let remainingDamage = 0;
            for (const card of this.dungeon) {
                if (this.getCardType(card) === 'monster') {
                    remainingDamage += card.numericValue;
                }
            }
            return -(Math.abs(this.health) + remainingDamage);
        }

        // Success! Calculate score based on health and level
        return this.health * this.level;
    }

    // Add method to check if player won (didn't die and cleared dungeon)
    hasWon() {
        return this.health > 0 && this.dungeon.length === 0;
    }
} 
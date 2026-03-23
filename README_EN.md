# Five Luminaries Blessing

This repository is a pure front-end lottery simulator. The entry file is [index.html](./index.html), the actual page is [wycf/Demo.html](./wycf/Demo.html), and the main logic is in [wycf/Demo.js](./wycf/Demo.js).

This document is based on the source code behavior rather than official event copy. The goal is to describe the actual rules, probabilities, and reward logic implemented in the program.

## How to Run

This is a static web project and does not require dependency installation.

Open either:

- `index.html`
- or `wycf/Demo.html`

## Main UI Concepts

The page uses the following concepts:

- `Balance`: currency consumed by the initial draw and protected append.
- `Current Result`: the currently rolled element and star level.
- `Five Luminaries Token`: can be claimed directly or spent in the shop.
- `Reward`: item reward shown once a high enough star level is reached.
- `Maserati Exchange Badge`: earned from high-star rewards or shop exchange, then used for vehicle redemption.
- `My Items`: the list of items you have claimed or exchanged.

## Basic Draw Rules

Clicking `Draw (6)` performs two random rolls:

1. Roll one of the five elements.
2. Roll an initial star level.

Each initial draw always costs `6` balance.

A new round can only start when there is no unclaimed reward left from the current round. In practice, that means you must click `Claim Reward` before starting another fresh draw.

## Random Probabilities

The probability comments in the page and the implementation in `Demo.js` match.

### Element Probability

The five elements are evenly distributed:

| Element | Probability |
| --- | --- |
| Gold | 20% |
| Wood | 20% |
| Water | 20% |
| Fire | 20% |
| Earth | 20% |

Implementation note:

- `face()` uses `Math.floor(10 * Math.random())`
- every two integer outcomes map to one element, so each element is `2/10 = 20%`

### Initial Star Probability

The initial star roll has the following probabilities:

| Initial Star Level | Probability |
| --- | --- |
| 1-star | 82% |
| 2-star | 17% |
| 3-star | 1% |

Implementation note:

- in `fott()`
- `< 8.2` returns 1-star
- `< 9.9` returns 2-star
- otherwise returns 3-star

## Append System

After the initial draw, the player can continue appending. Appending means rolling a new element and star value, then checking whether the new element matches the current main element.

The main element is always the element obtained from the very first draw of the round.

### Normal Append

Normal append does not consume extra balance.

Each normal append rerolls:

- element: 20% chance to match the current main element, 80% chance to miss
- star value: still 82% / 17% / 1% for 1/2/3 stars

Resolution:

- if the rolled element matches the current main element, the append succeeds and the current star total increases by the rolled star value
- if the rolled element does not match, the append fails and the downgrade logic is triggered

So the per-attempt success rate of normal append is fixed:

| Result | Probability |
| --- | --- |
| Append succeeds | 20% |
| Append fails | 80% |

### Protected Append

Protected append consumes balance based on the current star level:

| Current Star Level | Cost |
| --- | --- |
| 1-star | 6 |
| 2-star | 17 |
| 3-star | 51 |
| 4-star | 153 |
| 5-star | 440 |
| 6-star | 827 |

Special rules for protected append:

- the first two protected attempts still roll element normally
- if both of those attempts miss the current main element, the 3rd attempt is forcibly changed to the current element and therefore succeeds
- protected append failure does not downgrade stars
- instead, it only increments an internal protection-failure counter
- once a protected append succeeds, that counter resets

Viewed by single click:

- 1st protected append success rate: 20%
- if the 1st fails, the 2nd still has a 20% success rate
- if the first 2 both fail, the 3rd is guaranteed: 100%

Viewed as a full protection cycle of up to 3 attempts:

- success within 1 attempt: 20%
- success on the 2nd attempt: `0.8 * 0.2 = 16%`
- guaranteed success on the 3rd attempt: `0.8 * 0.8 = 64%`
- total success rate: 100%

## Downgrade Rules After Append Failure

This section only applies when a normal append fails.

The page comments and `adddefeat()` implement the same probabilities:

| Outcome After Failure | Probability |
| --- | --- |
| Drop by 1 star | 75% |
| Drop by 2 stars | 25% |

However, if a normal append fails while currently at `1-star`, the code does not leave the round at 0 stars. Instead it:

- clears the current result
- immediately grants `Five Luminaries Token ×2`

So a failed append at 1-star effectively ends the round and pays out 2 tokens.

### Actual Settlement by Star Level

| Star Level Before Failure | 75% Case | 25% Case |
| --- | --- | --- |
| 1-star | immediately settle 2 tokens | does not occur |
| 2-star | immediately settle 12 tokens | immediately settle 4 tokens |
| 3-star | immediately settle 36 tokens | immediately settle 12 tokens |
| 4-star | fall back to 3-star, can claim 54 tokens or the 3-star item | fall back to 2-star, immediately settle 36 tokens |
| 5-star | fall back to 4-star, can claim 160 tokens or the 4-star item | fall back to 3-star, can claim 54 tokens or the 3-star item |
| 6-star | fall back to 5-star, can claim 480 tokens or the 5-star item | fall back to 4-star, can claim 160 tokens or the 4-star item |

Additional notes:

- if failure leaves you at 3 stars or above, the page regenerates the reward display for that new star level
- if failure leaves you at 2 stars or below, the item reward becomes `NULL` and only token payout remains

## Star Cap

`uplimit()` limits the reachable star cap to `7 stars`.

Once 7 stars or above is reached:

- normal append is disabled
- protected append is disabled
- the page tells the player to claim the reward

Some functions include compatibility branches for `7/8/9 stars`, but in normal page flow the effective cap is 7 stars.

## Token Rewards by Star Level

Each claimable star level corresponds to a token amount:

| Star Level | Five Luminaries Tokens |
| --- | --- |
| 1-star | 12 |
| 2-star | 36 |
| 3-star | 54 |
| 4-star | 160 |
| 5-star | 480 |
| 6-star | 1440 |
| 7-star | 4320 |

There are two ways to gain tokens:

- reach a star level normally, then choose the token reward and click `Claim Reward`
- fail a normal append and receive direct token settlement from the downgrade logic

## Item Reward Rules

From `3 stars` onward, the page also shows an item reward that can be claimed.

At the end of a round, the player must choose one of the two:

- claim the token reward
- claim the item reward

### 3-Star Rewards

The 3-star reward pool has three categories with roughly one-third distribution:

| Reward Type | Probability |
| --- | --- |
| Matching-element backpack charm | 33% |
| Supreme Dragon Sparrow parachute | 33% |
| Pan - Five-Clawed Golden Dragon | 34% |

More precisely, the code does:

- `rdm <= 3.3`: matching-element backpack charm
- `3.3 < rdm <= 6.6`: Supreme Dragon Sparrow parachute
- `rdm > 6.6`: Pan - Five-Clawed Golden Dragon

The matching-element set depends on the original element:

- Gold: White Tiger
- Wood: Azure Dragon
- Water: Black Tortoise
- Fire: Vermilion Bird
- Earth: War Qilin

### 4-Star Rewards

A 4-star reward is always one of two items from the matching element set:

| Reward Type | Probability |
| --- | --- |
| Matching-element backpack | 50% |
| Matching-element helmet | 50% |

### 5-Star Rewards

The 5-star reward pool also has three categories with roughly one-third distribution:

| Reward Type | Probability |
| --- | --- |
| Matching-element outfit | 33% |
| Supreme Dragon Sparrow flight suit | 33% |
| M416 - Five-Clawed Golden Dragon | 34% |

More precisely, the code does:

- `rdm <= 3.3`: matching-element outfit
- `3.3 < rdm <= 6.6`: Supreme Dragon Sparrow flight suit
- `rdm > 6.6`: M416 - Five-Clawed Golden Dragon

### 6-Star and 7-Star Rewards

| Star Level | Reward |
| --- | --- |
| 6-star | Maserati Exchange Badge ×1 |
| 7-star | Maserati Exchange Badge ×3 |

The code returns `Maserati Exchange Badge ×3` for `7/8/9 stars`, but normal gameplay only reaches 7 stars.

## Claim Reward Rules

At the end of each round, the player must manually select and click `Claim Reward`.

### Claiming Tokens

If the left token option is selected:

- the corresponding token amount is added to the player's token total
- the current round ends

### Claiming the Right-Side Reward

If the right reward option is selected:

- 3/4/5-star item rewards are added to `My Items`
- 6-star grants `Maserati Exchange Badge +1`
- 7-star grants `Maserati Exchange Badge +3`
- the current round ends

So at 6 and 7 stars, the right-side reward is effectively a badge reward rather than a normal inventory item.

## Shop Exchange Rules

After clicking `Open Token Shop`, the player can exchange tokens or Maserati badges for items.

### Token Exchange

| Item | Cost |
| --- | --- |
| Outfit - Gold White Tiger | 972 tokens |
| Backpack Charm - Gold White Tiger | 108 tokens |
| Gold White Tiger Helmet | 324 tokens |
| Gold White Tiger Backpack | 324 tokens |
| Outfit - Wood Azure Dragon | 972 tokens |
| Backpack Charm - Wood Azure Dragon | 108 tokens |
| Wood Azure Dragon Helmet | 324 tokens |
| Wood Azure Dragon Backpack | 324 tokens |
| Outfit - Water Black Tortoise | 972 tokens |
| Backpack Charm - Water Black Tortoise | 108 tokens |
| Water Black Tortoise Helmet | 324 tokens |
| Water Black Tortoise Backpack | 324 tokens |
| Outfit - Fire Vermilion Bird | 972 tokens |
| Backpack Charm - Fire Vermilion Bird | 108 tokens |
| Fire Vermilion Bird Helmet | 324 tokens |
| Fire Vermilion Bird Backpack | 324 tokens |
| Outfit - Earth War Qilin | 972 tokens |
| Backpack Charm - Earth War Qilin | 108 tokens |
| Earth War Qilin Helmet | 324 tokens |
| Earth War Qilin Backpack | 324 tokens |
| Supreme Dragon Sparrow Flight Suit | 972 tokens |
| M416 - Five-Clawed Golden Dragon | 972 tokens |
| Supreme Dragon Sparrow Parachute | 108 tokens |
| Pan - Five-Clawed Golden Dragon | 108 tokens |
| Maserati Exchange Badge ×1 | 2916 tokens |

### Maserati Badge Exchange

| Item | Cost |
| --- | --- |
| Maserati Ghibli (Blue) | 1 badge |
| Maserati Ghibli (Pink) | 1 badge |
| Maserati Ghibli (Gold) | 3 badges |

## Key Takeaways

### 1. Normal append is extremely luck-based

Because success only depends on matching the current element, and the five elements are equally distributed:

- each normal append has only a `20%` success rate
- each normal append has an `80%` failure rate

### 2. Protected append is guaranteed within three tries

Protected append is not just “no downgrade on failure.” It also has an explicit pity rule:

- after two consecutive protected failures
- the third attempt is forced to use the current element
- so success is guaranteed within three protected attempts

### 3. 3-star and 5-star pools are not perfectly even

Because the thresholds are `3.3 / 6.6 / 10`, the effective distribution is:

- first tier: 33%
- second tier: 33%
- third tier: 34%

### 4. High-star failure does not always end the round immediately

At 4 stars and above, a failed normal append may simply knock the player back into a lower but still claimable star level rather than ending the round outright.

For example:

- failing at 5 stars can drop the round to 4 or 3 stars
- failing at 6 stars can drop the round to 5 or 4 stars

The player still has to click `Claim Reward` to finish that round.

### 5. Some logic is driven by the display string

The implementation mixes UI state and game logic in a few places. For example:

- the current star count is inferred from the result string length
- reward functions include compatibility branches for star levels above the normal cap
- the displayed reward is regenerated after downgrade based on the new star level

So when maintaining the code, it helps to read both the current result string and the intended star-state transitions together.

## Source Code Mapping

These are the most important functions if you want to maintain the project:

- `face()`: element probability
- `fott()`: initial and append star probability
- `f()`: start a new draw round
- `f1()`: normal append
- `f2()`: protected append
- `adddefeat()`: downgrade and compensation after normal append failure
- `getdebris()`: token count by star level
- `getprize()`: reward pools by star level
- `spendbhzj()`: protected append cost
- `f5()` / `ff0()` / `ff1()`: shop exchange logic

## One-Sentence Summary

This page simulates an event where the player first rolls an element and initial star level, then pushes for higher stars through append attempts, and finally chooses between token payout and item reward. The core probabilities are:

- element: 20% each
- initial star: 1-star 82%, 2-star 17%, 3-star 1%
- normal append success: 20%
- normal append failure downgrade: 75% for minus 1 star, 25% for minus 2 stars
- protected append: first two attempts are 20% each, third attempt is guaranteed

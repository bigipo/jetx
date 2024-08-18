// Elements
const betAmount = document.getElementById("bet-amount")
const betButton = document.getElementById("bet-button");
const multiplier = document.getElementById("counter");
const liveEarnings = document.getElementById("live-earnings");
const bank = document.getElementById("bank-val");

const countdownContainer = document.getElementById("anim-countdown");
const countdown = document.getElementById("anim-countdown-text");
const animT = document.getElementById("anim-ship-travel");
const animS = document.getElementById("anim-ship-shake");
const animD = document.getElementById("anim-ship-drop");
const animE = document.getElementById("anim-env");

let currBet = 0;

// Fonction Sleep
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Fonction changer texte
const setButtonValue = (obj, val) => {
  obj.name = val;
  obj.innerHTML = val;
};

// Fonction alerte
const displayAlert = (title, text) => {
  const alert = document.getElementById("alert-anim");
  alert.querySelector("strong").innerHTML = title;
  alert.querySelector("span").innerHTML = text;
  reTriggerAnimation(alert);
  setAnimState(alert, "running");
};

// Fonction parier
function betButtonClicked() {
  if (betButton.name === "Placer le pari") {
    if (betAmount.value == "" || betAmount.value <= 0) {
      displayAlert("Invalide.", "Entrez un montant de pari valide");
      return;
    } else if (betAmount.value > parseFloat(bank.innerHTML)) {
      displayAlert("Erreur.", "Vous n'avez pas assez d'argent");
      return;
    } else {
      setButtonValue(betButton, "Annuler");
      currBet = parseFloat(betAmount.value);
      bank.innerHTML = (parseFloat(bank.innerHTML) - currBet).toFixed(2); // Déduire la mise immédiatement
      return;
    }
  } else if (betButton.name === "Annuler") {
    bank.innerHTML = (parseFloat(bank.innerHTML) + currBet).toFixed(2); // Remettre l'argent dans la banque
    currBet = 0;
    setButtonValue(betButton, "Placer le pari");
    return;
  }else if (betButton.name === "Sauter") {
    cashout(currBet, bank);
    setButtonValue(betButton, "Sorti !");
    currBet = 0;
    return;
  }
}

// Fonction d'animation du multiplicateur
const animateValues = async (obj, end, button) => {
  obj.innerHTML = "×" + (1).toFixed(2) ;
  
  setButtonValue(button, currBet > 0 ? "Sauter" : "Attendre");
  let betAmount = currBet; 

  for (let i = 1; i <= (end - 1) * 100; i++) {
    await sleep((1 / (0.23 * i + 1)) * 1000); // 0.23 = la vitesse à laquelle le multiplicateur augmente
    let multiplierValue = (1 + i / 100.0).toFixed(2);
    obj.innerHTML = "×" + multiplierValue;
    liveEarnings.innerHTML = (betAmount * multiplierValue).toFixed(2) + " USDT";
  }

  // Explosion
  obj.style.color = "#C41E3A"; // Change la couleur du multiplicateur pour indiquer l'explosion
    
  // Ajouter le résultat de la manche
  addResult(end.toFixed(2));

  resetShipAnimation();
  setTimeout(() => {
    setButtonValue(betButton, "Placer le pari");
    liveEarnings.innerHTML = "0.00 USDT"; 
    betAmount.value = "";
    runSim(); // Redémarre le décompte pour un nouveau round
  }, 4000); // Durée où il est écrit 'BOOM'
};

// Fonction pour gérer le cashout
const cashout = (currBet, bank) => {
  const mult = parseFloat(multiplier.innerHTML.replace("×", "")); // Supprime le '×' et convertit en nombre
  displayAlert(
    "Vous êtes sorti à " + mult + "x.", "Vous avez gagné " + (parseFloat(currBet) * mult).toFixed(2) + " USDT"
  );

  bank.innerText = (parseFloat(bank.innerText) + parseFloat(currBet) * mult).toFixed(2);

  currBet = 0; // Réinitialiser currBet après le cashout
};

// Fonction simulation
function runSim() {

  if (currBet > 0) {
    setButtonValue(betButton, "Sauter");
  }

  multiplier.style.color = "rgba(199, 210, 254)";

  getFactor(
    21, // Initial Crash Rate: Chance the game crashes at 1 (1/v * 100)% of the time). The lower the value, the more likely it is to crash at 1
    1.2, // Growth Rate: The Pareto index, It can be used to skew the results in favor of the casino
    multiplier,
    betButton
  );
}

// Fonction pour l'animation du décompte
const startCountdown = async () => {
  countdown.style.color = "#C7D2FE";
  setCountdownBg(true);

  for (let i = 500; i >= 0; i--) { // 500 centièmes de seconde = 5 secondes
    countdown.innerHTML = (i / 100).toFixed(2); // Afficher le temps avec deux décimales
    await sleep(10); // Attendre 10 millisecondes pour mettre à jour l'affichage
  }

  // Une fois le décompte terminé
  countdown.innerHTML = "";
  setCountdownBg(false);
  countdown.style.color = "#C41E3A";
};

const getFactor = (div, g, mult, button) => {
  try {
    startGameAnimation(div, g, mult, button);
  } catch (error) {
    console.error("Erreur lors de la récupération des données:", error);
  } finally {
    // Code de nettoyage ou de finalisation
  }
};

const startShipAnimation = async (div, g, mult, button) => {
  // Calculer la valeur du multiplicateur au moment du décollage
  const response = await axios.get(`/crash?div=${div}&g=${g}`);
  const crashValue = Math.round(response.data * 100) / 100;
  console.log("Valeur de crash calculée:", crashValue);

  reTriggerAnimation(animT);
  reTriggerAnimation(animE);
  reTriggerAnimation(animD);

  animS.src = "../static/img/spaceship.svg";
  setAnimState(animT, "running");
  setAnimState(animS, "running");
  setAnimState(animE, "running");
  setAnimState(animD, "paused");

  // Commencer l'animation des valeurs avec le crashValue calculé
  animateValues(mult, crashValue, button);
};

// Fonction pour démarrer l'animation complète
const startGameAnimation = async (div, g, mult, button) => {
  await startCountdown(); // Lance le décompte de 5 secondes
  startShipAnimation(div, g, mult, button); // Lance le décollage de la fusée avec le calcul du multiplicateur
};

// Space dropping/crashing animation
const resetShipAnimation = () => {
  animS.src = "../static/img/spaceship-rest.svg";
  countdown.innerHTML = "BOOM";
  setAnimState(animT, "paused");
  setAnimState(animS, "paused");
  setAnimState(animD, "running");
};

// Reseting animations to their first frame
const reTriggerAnimation = (obj) => {
  obj.style.animation = "none";
  obj.offsetHeight;
  obj.style.animation = null;
};

const setAnimState = (obj, val) => {
  obj.style.animationPlayState = val;
};

const setCountdownBg = (bool) => {
  if (bool) {
    countdownContainer.style.backgroundColor = "rgba(17, 24, 39, 1)";
  } else {
    countdownContainer.style.backgroundColor = "rgba(17, 24, 39, 0)";
  }
};

// Fonction insérer les résultats
function addResult(multiplier) {
  const resultsContainer = document.getElementById("results-container");

  // Créer un nouvel élément pour le résultat
  const newResult = document.createElement("div");
  newResult.className = "result-item";
  newResult.innerHTML = "×" + multiplier;

  // Insérer le nouvel élément au début du conteneur
  resultsContainer.insertBefore(newResult, resultsContainer.firstChild);

  const children = resultsContainer.children;
  for (let i = 1; i < children.length; i++) {
    children[i].style.transform = `translateX(${newResult.offsetWidth + 10}px)`; 
  }

  // Réinitialiser la translation des autres éléments après l'animation
  setTimeout(() => {
    for (let i = 1; i < children.length; i++) {
      children[i].style.transform = "translateX(0)";
    }
  }, 200); // La durée doit correspondre à la durée de l'animation CSS
}


//liyek64651@chaladas.com cactus911
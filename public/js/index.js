const theoArr;
const conversionFactorsArr;

let unitForm = document.getElementById('');
let maxForm = document.getElementById('');
let warmupForm = document.getElementById('');

let unitErrorMsg = document.getElementById('');
let maxErrorMsg = document.getElementById('');
let warmupErrorMsg = document.getElementById('');

let unitValue = document.getElementById('');
let unit = document.getElementById('');
let displayUnit = document.getElementById('');

let weight = document.getElementById('');
let reps = document.getElementById('');
let displayMax = document.getElementById('');

let oldMax = document.getElementById('');
let maxGoal = document.getElementById('');
let warmupParent = document.getElementById('');

unitForm.addEventListener('submit', unitConvert(e));
maxForm.addEventListener('submit', oneRepMax(e));
warmupForm.addEventListener('submit', setWarmup(e));

function unitConvert(e){
    e.preventDefault();

}

function oneRepMax(e){
    e.preventDefault();

}

function setWarmup(e){
    e.preventDefault();

}

function roundToFive(value){

}
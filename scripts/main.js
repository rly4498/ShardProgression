Vars.enableConsole = true;

let scripts = [
  //Blocks-power
  "blocks/power/hydro-generator",
  "blocks/power/turbine-generator",

  //Blocks-production
  "blocks/production/automated-press",

  //Blocks-turret
  "blocks/turrets/spark"
];

scripts.forEach(cont => {
  try{
    require(cont);
  }catch(err){
    Log.err(err);
  }
});
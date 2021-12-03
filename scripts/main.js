let scripts = [
  //Blocks-power
  "blocks/power/hydro-generator",
  "blocks/power/turbine-generator",

  //Blocks-production
  "blocks/production/automated-press"
];

scripts.forEach(cont => {
  try{
    require(cont);
  }catch(err){
    Log.err(err);
  }
});
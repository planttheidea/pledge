pledge
======

Tiny library to provide a simple interface for promise functionality

### Purpose

To introduce a simple, straightforward interface to promise / defer functionality even if the browser is not ECMA6 compliant. This in no way promises (no pun intended) to be Promise/A+ compliant, but rather to provide the mechanisms you would expect from the functionality without reliance on other libraries or frameworks.

### Size

+ Uncompressed: 6.49KB
+ Minified: 2.4KB
+ Minified and gzipped: 885B

### Methods

**Pledge()**

Provide basic promise functionality, allowing for conversion of function execution to become asynchronous. To execute the method, pass in the first function in the chain.

Methods used in pledges:
+ complete()
  + Processes function passed, not continuing chain afterwards
  + Parameters:
    + Function to process if previous step successful *(function, required)*
    + Function to process if previous step unsuccessful *(function, optional)*
+ concurrent()
  + Processes in parallel list of functions passed, continuing chain afterwards
  + Parameters:
    + Functions to process if previous step successful *(array, required)*
    + Function to process if previous step unsuccessful *(function, optional)*
+ consecutive()
  + Processes in order list of functions passed, continuing chain afterwards
  + Parameters:
    + Functions to process if previous step successful *(array, required)*
    + Function(s) to process if previous step unsuccessful *(array / function, optional)*
+ proceed()
  + Processes function passed, continuing chain afterwards
  + Parameters:
    + Function to process if previous step successful *(function, required)*
    + Function to process if previous step unsuccessful *(function, optional)*
+ start()
  + Processes function passed, beginning chain that continues afterwards
    + Parameters:
      + Function to process *(function, required)*
  + Not required, passing function to *$.pledge* will perform the same function
+ wait()
  + Delays chain of promises for period of time passed in
  + Parameters:
    + delay, in milliseconds *(integer, required)*
    + test to determine if should continue or not *(boolean / function, optional)*

Examples:
```html
var func1 = function(data){
    console.log(data);
    this.resolve('Data from func1');
  },
  func2 = function(data){
    console.log(data);
    this.resolve('Data from func2');
  },
  x = 10;

Pledge(function(){
  console.log('Begin');
  this.resolve('Data from first');
})
  .proceed(function(data){
    var self = this;
    // capture this, because it changes inside setTimeout
  
    window.setTimeout(function(){
      console.log(data);
      // logs "Data from first"
      self.resolve('Data from second');
    },1000);
  })
  .wait(1000)
  // waits for 1 second before continuing
  .consecutive([func1,func2])
  // first logs "Data from second", then logs "Data from func1"
  .wait(2500,(x === 10))
  // waits for 2.5 seconds before continuing, only because (x === 10) is true
  .concurrent([func1,func2])
  // logs "Data from func2" twice (as the same data was passed into each concurrent function)
  .wait(500,function(){
    return (x > 5);
  })
  // waits for 0.5 seconds before continuing, only because the function return is true
  .complete(function(data){
    console.log(data);
    // logs array ["Data from func1","Data from func2"]
    // array is in order of processing finished, not in order of array passed in
  
    window.setTimeout(function(){
      console.log('done');
      // no promise is returned from the complete method
    });
  });
```

**Postpone()**

Provide basic deferred functionality, allowing a function to have a promise allocated to it simply by executing it. To execute this method, assign the deferred to a variable and apply methods.

Example:
```html
function testDeferred(x){
  var postpone = Postpone();
      
  if(x === 10){
    postpone.resolve('X equals 10');
  } else {
    postpone.reject('X does not equal 10');
  }
  
  return postpone.pledge();
}

testDeferred(10).proceed(function(data){
  console.log(data);
  // logs "X equals 10"
});

testDeferred(20).proceed(function(data){
  console.log(data);
  // logs "X does not equal 10"
});
```
In application of the function with the deferred returned, it operates like any other promise. However, there are methods unique to *Postpone*:
+ resolve *(string, optional)*
  + Assigns data that will be passed to the next function in the promise chain
+ reject *(string, optional)*
  + Assigns data that will be passed upon rejection
+ pledge *(no parameters)*
  + Used in the return to instantiate a new pledge and begin the chain

/*
 *
 * Copyright 2014 Tony Quetano under the terms of the MIT
 * license found at https://github.com/planttheidea/pledge/MIT_License.txt
 *
 * pledge.js - A compact library to provide simple promise functionality
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/
(function(window,document){
	// reusable error messages
	var throwError = function(e){
			throw new Error(e);
		},
		states = {
			resolved:'resolved',
			rejected:'rejected'
		}
		errors = {
			badParam:'Parameter passed is not a valid type for this method.',
            testFailed:'Test did not pass.'
		},
		throwError = function(e){
			throw new Error(e);
		},
		type = function(obj){
			return Object.prototype.toString.call(obj).replace(/^\[object (.+)\]$/, "$1").toLowerCase();
		}
		// create Pledge object
		Pledge = function(){
			// reset Pledge object
			this.init = function(){
				this.resolved = {};
				this.rejected = {};
				
				this.puid = -1;
				this.cuid = -1;
			};
			
			// execute resolution of pledge
			this.resolve = function(data){
				this.cuid++;

				if(this.resolved[this.cuid]){
					this.resolved[this.cuid].call(this,data);
				}
			};

			// execute rejection of pledge
			this.reject = function(e){	
				this.cuid++;

				if(this.rejected[this.cuid]){
					this.rejected[this.cuid].call(this,e);
				}
			};
			
			/*
			 * functions are stacked in order, awaiting
			 * resolution before the next in line is executed
			 */
			this.push = function(onResolution, onRejection){
				this.puid++;

				if(type(onResolution) === 'function'){
					this.resolved[this.puid] = onResolution;
				} else {
					this.resolved[this.puid] = undefined;
				}

				if(type(onRejection) === 'function'){
					this.rejected[this.puid] = onRejection;
				} else {
					this.rejected[this.puid] = function(e){
						throwError('Rejected: ' + (e || ''));
					};
				}
			};
			
			this.init();
			
			return this;
		},
		// create Postpone object
		Postpone = function(){
			// caching needed for this.pledge
			var self = this;
			
			// assign data for resolution of postponed function
			this.resolve = function(resolutionData){
				this.resolvePostpone = true;
				this.resolveData = resolutionData;
			};
			
			// assign data for rejection of postponed function
			this.reject = function(rejectionData){
				this.rejectPostpone = true;
				this.rejectData = rejectionData;
			};
			
			/*
			 * create new Pledge, begin the chain with simple
			 * resolution or rejection, based on assignment (only
			 * this.resolve OR this.reject is defined in a proper
			 * scenario; if both are assigned, defaults to resolve)
			 */
			this.pledge = function(){
				return (new Pledge()).start(function(){
					var p = this;
					
					if(self.resolvePostpone) {
						p.resolve(self.resolveData);
					} else if(self.rejectPostpone) {
						p.reject(self.rejectData);
					}
				});
			};
		};
	
	// build functions for API of Pledge
	Pledge.prototype = {
		// executes function but does not continue the chain
		complete:function(onResolution,onRejection){
			this.push(onResolution, onRejection);
		},
		// executes all functions passed in order of array values
		consecutive:function(onResolutions,onRejections){
			var rejectionType = type(onRejections),
				validRejection = false;
			
			// make sure its a valid type
			switch(rejectionType){
				case 'array':
				case 'function':
				case 'undefined':
					validRejection = true;
					break;
				default:
					validRejection = false;
					break;
			}
			
			// value passed must be array
			if((type(onResolutions) === 'array') && validRejection){
				/* each rejection can have a unique function (array passed),
				 * or can have single rejection function (function passed)
				 */
				var isArray = (rejectionType === 'array');
				
				for(var i = 0, len = onResolutions.length; i < len; i++){
					if(isArray){
						this.push(onResolutions[i], onRejections[i]);
					} else {
						this.push(onResolutions[i], onRejections);
					}
				}
				
				return this;
			} else {
				throwError(errors.badParam);
			}
		},
		// executes all functions passed simultaneously
		concurrent:function(onResolutions,onRejection){
			var validRejection = false;
			
			// make sure its a valid type
			switch(type(onRejections)){
				case 'function':
				case 'undefined':
					validRejection = true;
					break;
				default:
					validRejection = false;
					break;
			}
			
			// cannot pass array of rejectio
			if(validRejection){
				var len = onResolutions.length,
					finished = [];
				
				/*
				 * create unique Pledge for each function, and upon
				 * resolution push the data to the finished array;
				 * when finished array is equal to the length of
				 * the length of resolution functions, all resolutions
				 * have occured, and so the concurrent step resolves
				 */
				function newPledge(fn,self,data){                        
					(new Pledge()).start(function(){
						fn.call(this,data);
					}).complete(function(newData){
						finished.push(newData);
						
						if(finished.length === len){
							self.resolve(finished);
						}
					});
				}
				
				/*
				 * create proceed function calling newPledge for
				 * each function in array
				 */
				return this.proceed(function(data){
					for(var i = len; i--;){
						newPledge(onResolutions[i],this,data);
					}
				},onRejection);
			} else {
				throwError(errors.badParam);
			}
		},
		// push the resolve / reject functions to stack and continue chain
		proceed:function(onResolution,onRejection){
			this.push(onResolution, onRejection);     
			return this;
		},
		// begin chain by executing function
		start:function(fn){
			if(type(fn) === 'function'){
				var self = this;
				
				window.setTimeout(function(){
					fn.call(self);
				},0);
				
				return self;
			}
		},
		/*
		 * create delay of processing based on delay passed,
		 * and if test function is passed then continue if true
		 */
		wait:function(delay,test){
			var self = this,
				testResult;
			
			// must pass delay to function
			if(!delay){
				throwError(errors.badParam);
			}
			
			// determine test type
			switch(type(test)){
				case 'boolean':
					testResult = test;
					break;
				case 'function':
					testResult = test();
					break;
				default:
					testResult = true;
					break;
			}
			
			/*
			 * create proceed function creating setTImeout for
			 * before resolving itself
			 */
			return self.proceed(function(data){
				window.setTimeout(function(){
					if(testResult){
						self.resolve.call(self,data);
					} else {
						self.reject.call(self,errors.testFailed);
					}
				},delay);
			});
		}
	};
	
	// create window objects
	if(!window.Pledge){
		window.Pledge = function(fn){
			if(type(fn) === 'function'){
				return (new Pledge().start(fn));
			} else {
				throwError('Must pass function into Pledge().');
			}
		};
	}
	
	if(!window.Postpone){
		window.Postpone = function(){
			return new Postpone();
		};
	}
})(window,document);

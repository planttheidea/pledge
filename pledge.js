(function(window){
	var throwError(e){
			throw new Error(e);
		},
		errors = {
			badParam:'Parameter passed is not a valid type for this method.',
			resolveEqualReject:'The length of resolve functions does not equal the length of reject functions.'
		},
		Pledge = function(){
			this.init = function(){
				this.resolved = {};
				this.rejected = {};
				
				this.puid = -1;
				this.cuid = -1;
			};
			
			this.resolve = function(data){
				this.cuid++;

				if(this.resolved[this.cuid]){
					this.resolved[this.cuid].call(this,data);
				}
			};

			this.reject = function(e){					
				this.cuid++;

				if(this.rejected[this.cuid]){
					this.rejected[this.cuid].call(this,e);
				}
			};

			this.push = function(onResolution, onRejection){
				this.puid++;

				if($.type(onResolution) === 'function'){
					this.resolved[this.puid] = onResolution;
				} else {
					this.resolved[this.puid] = undefined;
				}

				if($.type(onRejection) === 'function'){
					this.rejected[this.puid] = onRejection;
				} else {
					this.rejected[this.puid] = function(e){
						throwError('Rejected: '+ e);
					};
				}
			};
			
			this.init();
			
			return this;
		},
		Postpone = function(){
			var self = this;
			
			this.resolve = function(resolutionData){
				this.resolvePostpone = true;
				this.resolveData = resolutionData;
			};
			
			this.reject = function(rejectionData){
				this.rejectPostpone = true;
				this.rejectData = rejectionData;
			};
			
			this.pledge = function(){
				return (new Pledge()).start(function(){
					var p = this;
					
					window.setTimeout(function(){
						if(self.resolvePostpone) {
							p.resolve(self.resolveData);
						} else if(rejectMe) {
							p.reject(self.rejectData);
						}
					},0);
				});
			};
		};
		
	Pledge.prototype = {
		complete:function(onResolution,onRejection){
			this.push(onResolution, onRejection);
		},
		consecutive:function(onResolutions,onRejections){
			var isArray = ($.type(onRejections) === 'array'),
				len = onResolutions.length;
			
			if(!isArray || (isArray && (len === onRejections.length))){
				for(var i = 0, len = onResolutions.length; i < len; i++){
					if(isArray){
						this.push(onResolutions[i], onRejections[i]);
					} else {
						this.push(onResolutions[i], onRejection);
					}
				}
				
				return this;
			} else if(isArray) {
				this.init();                
				throwError(errors.resolveEqualReject);
			}
		},
		concurrent:function(onResolutions,onRejection){
			if(($.type(onRejection) === 'undefined') || ($.type(onRejection) === 'function')){
				var len = onResolutions.length,
					finished = [];
				
				this.push(function(data){
					var self = this;
					
					for(var i = onResolutions.length; i--;){                    
						(new Pledge()).start(function(){
							onResolutions[i].call(this,data);
						}).complete(function(newData){
							finished.push(newData);
							
							if(finished.length === len){
								self.resolve(finished);
							}
						});
					}
				},onRejection);
												   
				return this;
			} else {
				this.init();
				throwError(errors.badParam);
			}
		},
		proceed:function(onResolution,onRejection){
			this.push(onResolution,onRejection);     
			return this;
		},
		start:function(fn){
			if($.type(fn) === 'function'){
				fn.call(this);
			}
			
			return this;
		}
	};
	
	window.Pledge = Pledge;
	window.Postpone = Postpone;
})(window);

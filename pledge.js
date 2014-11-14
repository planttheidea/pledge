(function(window){
    var throwError = function(e){
            throw new Error(e);
        },
        getType = function(obj){
			return Object.prototype.toString.call(obj).replace(/^\[object (.+)\]$/, "$1").toLowerCase();
		},
		errors = {
			badParam:'Parameter passed is not a valid type for this method.',
		},
        Pledge = function(){
            this.clear = function(){
                this.resolved = {};
                this.rejected = {};
                
                this.puid = -1;
                this.cuid = -1;
            };
            
			this.resolve = function(data){
				this.cuid++;

				if (this.resolved[this.cuid]){
					this.resolved[this.cuid].call(this,data);
				}
			};

			this.reject = function(e){
				this.cuid++;

				if (this.rejected[this.cuid]){
					this.rejected[this.cuid].call(this,e);
				}
			};

			this.push = function(onResolution, onRejection){
				this.puid++;

				if(getType(onResolution) === 'function'){
					this.resolved[this.puid] = onResolution;
				} else {
                    this.resolved[this.puid] = undefined;
				}

				if(getType(onRejection) === 'function'){
					this.rejected[this.puid] = onRejection;
				} else {
                    this.rejected[this.puid] = function(e){
                        throwError(e);
                    };
				}
			};
            
            this.clear();
            
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
            var isArray = (getType(onRejections) === 'array'),
				len = onResolutions.length;
            
            for(var i = 0, len = onResolutions.length; i < len; i++){
                if(isArray){
                    this.push(onResolutions[i], onRejections[i]);
                } else {
                    this.push(onResolutions[i], onRejections);
                }
            }
				
			return this;
        },
        concurrent:function(onResolutions,onRejection){
            if((getType(onRejection) === 'undefined') || (getType(onRejection) === 'function')){
                var len = onResolutions.length,
                    finished = [];
                
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
                
                this.push(function(data){
                    for(var i = onResolutions.length; i--;){
                        newPledge(onResolutions[i],this,data);
                    }
                },onRejection);
                                                   
                return this;
            } else {
                this.clear();
                throwError(errors.badParam);
            }
        },
        proceed:function(onResolution,onRejection){
            this.push(onResolution, onRejection);     
            return this;
        },
        start:function(fn){
            if(getType(fn) === 'function'){
                var self = this;
                
                window.setTimeout(function(){
                    fn.call(self);
                },0);
                
                return self;
            }
        }
    };
    
    window.Pledge = Pledge;
    window.Postpone = Postpone;
})(window);

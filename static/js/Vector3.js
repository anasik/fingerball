// URL: https://github.com/sebleedelisle/JSTouchController/blob/master/js/Vector3.js 
// Author: Seb Lee Delisle
// Modified: Vladislav Zorov

var Vector3 = function (x,y,io) {
	
	this.x= x || 0; 
	this.y = y || 0;
	this.io = io;
	
};

Vector3.prototype = {

	set x(val) {
		this.x=val;

	}

	reset: function ( x, y ) {

		this.x = x;
		this.y = y;

		return this;

	},

	toString : function (decPlaces) {
	 	decPlaces = decPlaces || 3; 
		var scalar = Math.pow(10,decPlaces); 
		return "[" + Math.round (this.x * scalar) / scalar + ", " + Math.round (this.y * scalar) / scalar + "]";
	},
	
	clone : function () {
		return new Vector3(this.x, this.y);
	},
	
	copyTo : function (v) {
		v.x = this.x;
		v.y = this.y;
	},
	
	copyFrom : function (v) {
		this.x = v.x;
		this.y = v.y;
	},	
	
	magnitude : function () {
		return Math.sqrt((this.x*this.x)+(this.y*this.y));
	},
	
	magnitudeSquared : function () {
		return (this.x*this.x)+(this.y*this.y);
	},
	
	normalise : function () {
		
		var m = this.magnitude();
				
		this.x = this.x/m;
		this.y = this.y/m;

		return this;	
	},
	
	reverse : function () {
		this.x = -this.x;
		this.y = -this.y;
		
		return this; 
	},
	
	plusEq : function (v) {
		this.x+=v.x;
		this.y+=v.y;
		
		return this; 
	},
	
	plusNew : function (v) {
		 return new Vector3(this.x+v.x, this.y+v.y); 
	},
	
	minusEq : function (v) {
		this.x-=v.x;
		this.y-=v.y;
		
		return this; 
	},

	minusNew : function (v) {
	 	return new Vector3(this.x-v.x, this.y-v.y); 
	},	
	
	multiplyEq : function (scalar) {
		this.x*=scalar;
		this.y*=scalar;
		
		return this; 
	},
	
	multiplyNew : function (scalar) {
		var returnvec = this.clone();
		return returnvec.multiplyEq(scalar);
	},
	
	divideEq : function (scalar) {
		this.x/=scalar;
		this.y/=scalar;
		return this; 
	},
	
	divideNew : function (scalar) {
		var returnvec = this.clone();
		return returnvec.divideEq(scalar);
	},

	dot : function (v) {
		return (this.x * v.x) + (this.y * v.y) ;
	},
	
	angle : function (useRadians) {
		
		return Math.atan2(this.y,this.x) * (useRadians ? 1 : Vector3Const.TO_DEGREES);
		
	},
	
	rotate : function (angle, useRadians) {
		
		var cosRY = Math.cos(angle * (useRadians ? 1 : Vector3Const.TO_RADIANS));
		var sinRY = Math.sin(angle * (useRadians ? 1 : Vector3Const.TO_RADIANS));
	
		Vector3Const.temp.copyFrom(this); 

		this.x= (Vector3Const.temp.x*cosRY)-(Vector3Const.temp.y*sinRY);
		this.y= (Vector3Const.temp.x*sinRY)+(Vector3Const.temp.y*cosRY);
		
		return this; 
	},	
		
	equals : function (v) {
		return((this.x==v.x)&&(this.y==v.x));
	},
	
	isCloseTo : function (v, tolerance) {	
		if(this.equals(v)) return true;
		
		Vector3Const.temp.copyFrom(this); 
		Vector3Const.temp.minusEq(v); 
		
		return(Vector3Const.temp.magnitudeSquared() < tolerance*tolerance);
	},
	
	rotateAroundPoint : function (point, angle, useRadians) {
		Vector3Const.temp.copyFrom(this); 
		//trace("rotate around point "+t+" "+point+" " +angle);
		Vector3Const.temp.minusEq(point);
		//trace("after subtract "+t);
		Vector3Const.temp.rotate(angle, useRadians);
		//trace("after rotate "+t);
		Vector3Const.temp.plusEq(point);
		//trace("after add "+t);
		this.copyFrom(Vector3Const.temp);
		
	}, 
	
	isMagLessThan : function (distance) {
		return(this.magnitudeSquared()<distance*distance);
	},
	
	isMagGreaterThan : function (distance) {
		return(this.magnitudeSquared()>distance*distance);
	},

    reflect : function (surfaceNorm) {
        Vector3Const.temp.copyFrom(surfaceNorm);
        Vector3Const.temp.multiplyEq(2 * this.dot(surfaceNorm));
        this.minusEq(Vector3Const.temp);
    }

	// still AS3 to convert : 
	// public function projectOnto(v:Vector3) : Vector3
	// {
	// 		var dp:Number = dot(v);
	// 
	// 		var f:Number = dp / ( v.x*v.x + v.y*v.y );
	// 
	// 		return new Vector3( f*v.x , f*v.y);
	// 	}
	// 
	// 
	// public function convertToNormal():void
	// {
	// 	var tempx:Number = x; 
	// 	x = -y; 
	// 	y = tempx; 
	// 	
	// 	
	// }		
	// public function getNormal():Vector3
	// {
	// 	
	// 	return new Vector3(-y,x); 
	// 	
	// }
	// 
	// 
	// 
	// public function getClosestPointOnLine ( vectorposition : Point, targetpoint : Point ) : Point
	// {
	// 	var m1 : Number = y / x ;
	// 	var m2 : Number = x / -y ;
	// 	
	// 	var b1 : Number = vectorposition.y - ( m1 * vectorposition.x ) ;
	// 	var b2 : Number = targetpoint.y - ( m2 * targetpoint.x ) ;
	// 	
	// 	var cx : Number = ( b2 - b1 ) / ( m1 - m2 ) ;
	// 	var cy : Number = m1 * cx + b1 ;
	// 	
	// 	return new Point ( cx, cy ) ;
	// }
	// 

};

Vector3Const = {
	TO_DEGREES : 180 / Math.PI,		
	TO_RADIANS : Math.PI / 180,
	temp : new Vector3()
	};

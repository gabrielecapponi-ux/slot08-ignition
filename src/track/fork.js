export function forkAt(fork,s){
 if(!fork||s<=fork.start||s>=fork.end)return {offset:0,first:0,second:0};
 const u=(s-fork.start)/fork.length,a=Math.PI*u,si=Math.sin(a),co=Math.cos(a),k=Math.PI/fork.length;
 // sin^4 joins with zero position, slope and curvature at both ends.
 return {offset:fork.gap*si**4,first:fork.gap*4*si**3*co*k,second:fork.gap*4*(3*si*si*co*co-si**4)*k*k};
}

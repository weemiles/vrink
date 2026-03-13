import{j as n}from"./index-DnApj4B-.js";function g({icon:a,variant:e="clear",iconSize:r=24,bgColor:s,color:c,className:i="",style:l,disabled:t,...u}){const d=s||"var(--toss-iconbutton-default-bg)",o=Math.max(r+16,44),f=()=>{switch(e){case"fill":return{backgroundColor:d,border:"none"};case"border":return{backgroundColor:"transparent",border:"1px solid var(--toss-iconbutton-border-color)"};case"clear":default:return{backgroundColor:"transparent",border:"none"}}},b=()=>{if(t)return"";switch(e){case"fill":return"active:opacity-70";case"border":case"clear":default:return"active:bg-[var(--toss-iconbutton-default-bg)]"}};return n.jsx("button",{disabled:t,className:`
        inline-flex items-center justify-center rounded-full transition-all
        ${t?"opacity-40 cursor-not-allowed":"cursor-pointer"}
        ${b()}
        ${i}
      `,style:{width:o,height:o,minWidth:44,minHeight:44,color:c||"var(--toss-grey-700)",...f(),...l},"aria-disabled":t||void 0,...u,children:n.jsx("span",{className:"flex items-center justify-center",style:{width:r,height:r},"aria-hidden":"true",children:a})})}export{g as I};

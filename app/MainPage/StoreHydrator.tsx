// app/StoreHydrator.tsx
'use client';
import { useEffect } from 'react';
import { store } from '@/app/store';
import { UserService } from '../services/users';

 export const storeHydrator = async () =>{

    try{
     const data = await UserService.getMyProfile()
     if(data.success){
      Object.assign(store, data.data);
     }
    }
    catch(err){
        console.log(err)
    }finally{
      store.hydrated = true;
    }
  }

export default function StoreHydrator() {
  useEffect(() => {
    storeHydrator()
  }, []);

  return null;
}
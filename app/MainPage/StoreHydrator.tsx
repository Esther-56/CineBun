// app/StoreHydrator.tsx
'use client';
import { useEffect } from 'react';
import { store } from '@/app/store';
import { UserService } from '../services/users';

export default function StoreHydrator() {

  const Get = async () =>{

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

  useEffect(() => {
    Get()
  }, []);

  return null;
}
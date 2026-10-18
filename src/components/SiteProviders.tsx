"use client";
import {usePathname} from 'next/navigation';
import {AuthProvider} from '@/contexts/AuthContext';
/** The public course explorer has no account or health-data dependency. */
export default function SiteProviders({children}:{children:React.ReactNode}){const path=usePathname();return path==='/'?<>{children}</>:<AuthProvider>{children}</AuthProvider>;}

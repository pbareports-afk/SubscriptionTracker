import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp, query, orderBy } from 'firebase/firestore';

export interface Subscription {
  id?: string;
  title: string;
  provider: string;
  companyId: string;
  category: string;
  expiryDate: Date;
  renewUrl: string;
  cost?: number;
  notes?: string;
  isNotified?: boolean;
}

export interface Company {
  id?: string;
  name: string;
}

// Subscriptions
export const getSubscriptions = async (): Promise<Subscription[]> => {
  const q = query(collection(db, 'subscriptions'), orderBy('expiryDate', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      expiryDate: data.expiryDate.toDate(),
    } as Subscription;
  });
};

export const addSubscription = async (subscription: Subscription) => {
  const data = {
    ...subscription,
    expiryDate: Timestamp.fromDate(subscription.expiryDate)
  };
  delete data.id;
  const docRef = await addDoc(collection(db, 'subscriptions'), data);
  return docRef.id;
};

export const updateSubscription = async (id: string, subscription: Partial<Subscription>) => {
  const data: any = { ...subscription };
  if (data.expiryDate) {
    data.expiryDate = Timestamp.fromDate(data.expiryDate);
  }
  delete data.id;
  await updateDoc(doc(db, 'subscriptions', id), data);
};

export const deleteSubscription = async (id: string) => {
  await deleteDoc(doc(db, 'subscriptions', id));
};

// Companies
export const getCompanies = async (): Promise<Company[]> => {
  const snapshot = await getDocs(collection(db, 'companies'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
};

export const addCompany = async (company: Company) => {
  const docRef = await addDoc(collection(db, 'companies'), { name: company.name });
  return docRef.id;
};

import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; 
import { doc, setDoc, getDoc } from 'firebase/firestore';
import ProfileView from './ProfileView';
import ProfileDialog from '@/components/ui/profile-dialog';

interface ProfileFormData {
  name: string;
  username: string;
  age: string | number;
  gender: string;
  homeCity: string;
  collegeName: string;
  degree: string;
  branch: string;
  year: string | number;
  about: string;
  bannerUrl?: string;
  avatarUrl?: string;
}

const Profile: React.FC = () => {
  const [isExistingUser, setIsExistingUser] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '', username: '', age: '', gender: '', homeCity: '',
    collegeName: '', degree: '', branch: '', year: '', about: ''
  });

  const fetchUserData = async () => {
    const user = auth.currentUser;
    if (user) {
      if (user.uid === "test-user-123") {
        const local = localStorage.getItem("skillsphere_dev_profile");
        if (local) {
          try {
            setFormData(JSON.parse(local));
            setIsExistingUser(true);
            setIsEditing(false);
            return;
          } catch (e) {}
        }
      }
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setFormData(docSnap.data() as ProfileFormData);
          setIsExistingUser(true);
          setIsEditing(false);
        } else {
          setIsEditing(true);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    }
  };

  useEffect(() => {
    fetchUserData();
    const onProfileUpdate = () => {
      fetchUserData();
    };
    window.addEventListener("profile-updated", onProfileUpdate);
    return () => window.removeEventListener("profile-updated", onProfileUpdate);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    
    if (!user) {
      alert("⚠️ Dev Bypass Mode: Profile data cannot be saved to the database without a real Google Login.");
      return;
    }

    try {
      await setDoc(doc(db, "users", user.uid), formData);
      setIsExistingUser(true);
      setIsEditing(false);
      alert(isExistingUser ? "Profile Updated!" : "Profile Saved!");
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  return (
    <div className="w-full h-full bg-background text-foreground flex justify-center items-center p-4 box-border transition-colors duration-200">
      {isEditing ? (
        <div className="bg-card border border-border w-full max-w-[460px] p-6 rounded-xl shadow-lg overflow-y-auto max-h-[90vh]">
          <h2 className="text-primary text-xl font-bold mb-4 text-center m-0 pb-2 border-b border-border">
            {isExistingUser ? "Update Profile" : "Setup Profile"}
          </h2>
          <form className="flex flex-col space-y-3" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-muted-foreground mb-1 text-xs">Name</label>
                <input className="w-full p-2 bg-secondary/50 border border-border text-foreground rounded-md text-xs outline-none focus:border-primary box-border" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your Name" required />
              </div>
              <div>
                <label className="block font-medium text-muted-foreground mb-1 text-xs">Username</label>
                <input className="w-full p-2 bg-secondary/50 border border-border text-foreground rounded-md text-xs outline-none focus:border-primary box-border" type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Your Username" required />
              </div>
              <div>
                <label className="block font-medium text-muted-foreground mb-1 text-xs">Age</label>
                <input className="w-full p-2 bg-secondary/50 border border-border text-foreground rounded-md text-xs outline-none focus:border-primary box-border" type="number" name="age" value={formData.age} onChange={handleChange} placeholder="Age" />
              </div>
              <div>
                <label className="block font-medium text-muted-foreground mb-1 text-xs">Gender</label>
                <select className="w-full p-2 bg-secondary/50 border border-border text-foreground rounded-md text-xs outline-none focus:border-primary box-border" name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block font-medium text-muted-foreground mb-1 text-xs">Home City</label>
                <input className="w-full p-2 bg-secondary/50 border border-border text-foreground rounded-md text-xs outline-none focus:border-primary box-border" type="text" name="homeCity" value={formData.homeCity} onChange={handleChange} placeholder="City" />
              </div>
            </div>

            <div>
              <label className="block font-medium text-muted-foreground mb-1 text-xs">College Name</label>
              <input className="w-full p-2 bg-secondary/50 border border-border text-foreground rounded-md text-xs outline-none focus:border-primary box-border" type="text" name="collegeName" value={formData.collegeName} onChange={handleChange} placeholder="Enter College" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-medium text-muted-foreground mb-1 text-xs">Degree</label>
                <input className="w-full p-2 bg-secondary/50 border border-border text-foreground rounded-md text-xs outline-none focus:border-primary box-border" type="text" name="degree" value={formData.degree} onChange={handleChange} placeholder="B.Tech" />
              </div>
              <div>
                <label className="block font-medium text-muted-foreground mb-1 text-xs">Branch</label>
                <input className="w-full p-2 bg-secondary/50 border border-border text-foreground rounded-md text-xs outline-none focus:border-primary box-border" type="text" name="branch" value={formData.branch} onChange={handleChange} placeholder="CSE" />
              </div>
              <div>
                <label className="block font-medium text-muted-foreground mb-1 text-xs">Year</label>
                <input className="w-full p-2 bg-secondary/50 border border-border text-foreground rounded-md text-xs outline-none focus:border-primary box-border" type="number" name="year" value={formData.year} onChange={handleChange} placeholder="3" />
              </div>
            </div>

            <div>
              <label className="block font-medium text-muted-foreground mb-1 text-xs">About College / Campus</label>
              <textarea className="w-full h-16 p-2 bg-secondary/50 border border-border text-foreground rounded-md text-xs outline-none focus:border-primary box-border resize-y" name="about" value={formData.about} onChange={handleChange} placeholder="Tell us about your campus..."></textarea>
            </div>

            <button type="submit" className="w-full bg-primary text-primary-foreground p-2.5 rounded-md text-sm font-semibold cursor-pointer mt-2 hover:bg-primary/90 transition-colors">
              {isExistingUser ? "Save Changes" : "Save Profile"}
            </button>
            
            {isExistingUser && (
              <button type="button" className="w-full bg-secondary text-secondary-foreground p-2.5 rounded-md text-sm font-semibold cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
            )}
          </form>
        </div>
      ) : (
        <ProfileView data={formData} onEdit={() => setIsEditDialogOpen(true)} />
      )}

      <ProfileDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSaved={fetchUserData}
      />
    </div>
  );
};

export default Profile;

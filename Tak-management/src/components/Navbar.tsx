
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { UserIcon, LogOut, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onNewTask?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNewTask }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="w-full h-16 bg-white border-b border-gray-200 px-4 flex-between">
      <div className="flex-start space-x-2">
        <h1 className="text-title text-blue-600">TaskCanvas</h1>
      </div>
      
      <div className="flex-end space-x-4">
        {user ? (
          <>
            {onNewTask && (
              <Button onClick={onNewTask} size="sm" className="primary-button">
                <Plus className="h-4 w-4 mr-1" />
                New Task
              </Button>
            )}
            <div className="user-avatar">
              <UserIcon className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium">{user.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-5 w-5 text-gray-500" />
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => navigate('/login')}>Log in</Button>
            <Button className="primary-button" onClick={() => navigate('/signup')}>Sign up</Button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

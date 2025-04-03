import React from 'react';
import { Button } from '../components/ui/button';
import { type VariantProps } from "class-variance-authority";
import { CheckCircle, MoveRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const features = [
    'Create and organize tasks with drag-and-drop simplicity',
    'Track progress with visual kanban-style boards',
    'Customize tasks with color-coded labels',
    'Collaborate with team members in real-time',
    'Access your tasks from any device',
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="w-full h-16 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold text-blue-600">TaskCanvas</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <Button 
              onClick={() => navigate('/board')} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              Go to Board
            </Button>
          ) : (
            <>
              <Button 
                variant="ghost"
                onClick={() => navigate('/login')}
              >
                Log in
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700" 
                onClick={() => navigate('/signup')}
              >
                Sign up
              </Button>
            </>
          )}
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 md:py-24 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Organize your tasks with <span className="text-blue-600">simplicity</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              TaskCanvas helps you manage projects, organize tasks, and build team momentum - all in one place.
            </p>
            
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                onClick={() => navigate(isAuthenticated ? '/board' : '/signup')} 
                className="bg-blue-600 hover:bg-blue-700 h-12 px-8"
              >
                Get Started <MoveRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline"
                className="h-12 px-8"
                onClick={() => navigate('/login')}
              >
                Try Demo
              </Button>
            </div>
          </div>
          
          {/* App Preview Image */}
          <div className="w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-2xl">
            <div className="w-full h-[400px] bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl flex flex-col sm:flex-row gap-4">
                <div className="flex-1 min-w-[250px] bg-gray-50 rounded-md p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm text-gray-700">To Do</h3>
                    <span className="text-xs px-2 py-0.5 bg-gray-200 rounded-full">2</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="p-3 bg-white rounded-md shadow-sm border border-gray-100">
                      <div className="flex flex-wrap gap-1 mb-2">
                        <span className="inline-block h-2 w-6 rounded-full bg-blue-500" />
                      </div>
                      <h4 className="font-medium text-sm mb-1">Research competitors</h4>
                      <p className="text-xs text-gray-500">Analyze competitor features and pricing</p>
                    </div>
                    
                    <div className="p-3 bg-white rounded-md shadow-sm border border-gray-100">
                      <div className="flex flex-wrap gap-1 mb-2">
                        <span className="inline-block h-2 w-6 rounded-full bg-green-500" />
                        <span className="inline-block h-2 w-6 rounded-full bg-yellow-500" />
                      </div>
                      <h4 className="font-medium text-sm mb-1">Create project plan</h4>
                      <p className="text-xs text-gray-500">Define project scope and timeline</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 min-w-[250px] bg-gray-50 rounded-md p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm text-gray-700">In Progress</h3>
                    <span className="text-xs px-2 py-0.5 bg-gray-200 rounded-full">1</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="p-3 bg-white rounded-md shadow-sm border border-gray-100">
                      <div className="flex flex-wrap gap-1 mb-2">
                        <span className="inline-block h-2 w-6 rounded-full bg-purple-500" />
                      </div>
                      <h4 className="font-medium text-sm mb-1">Design UI mockups</h4>
                      <p className="text-xs text-gray-500">Create wireframes for key screens</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center">
            Features that simplify task management
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <ul className="space-y-4">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                Why choose TaskCanvas?
              </h3>
              <p className="text-gray-700 mb-4">
                TaskCanvas provides a visual and intuitive interface to help you organize your work and stay on top of your projects. With our easy-to-use kanban board, you can manage tasks with simple drag-and-drop actions.
              </p>
              <p className="text-gray-700">
                Whether you're working solo or with a team, TaskCanvas helps you track progress, meet deadlines, and achieve your goals with efficiency.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 bg-blue-600 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to streamline your task management?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Sign up for free and start organizing your tasks today!
          </p>
          <Button 
            onClick={() => navigate(isAuthenticated ? '/board' : '/signup')} 
            variant="outline"
            className="h-12 px-8 bg-white text-blue-600 hover:bg-blue-50 border-white"
          >
            Get Started Now
          </Button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 bg-gray-800 text-gray-300">
        <div className="max-w-5xl mx-auto text-center">
          <h3 className="text-lg font-semibold mb-2 text-white">TaskCanvas</h3>
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} TaskCanvas. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

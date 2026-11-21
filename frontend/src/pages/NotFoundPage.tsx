import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass, ShoppingBag } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[65vh] flex items-center justify-center bg-[#FBF9F5] px-4 py-16">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-[#15472B]/10 flex items-center justify-center text-[#15472B]">
          <Compass className="w-10 h-10 stroke-[1.5]" />
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase font-bold tracking-[0.2em] text-[#C46B3B]">
            Error 404
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#15472B] tracking-tight">
            Harvest Not Found
          </h1>
          <p className="text-sm text-[#475569] leading-relaxed max-w-md mx-auto">
            The orchard path or product harvest you are looking for has been relocated, is out of season, or does not exist.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xs bg-[#15472B] hover:bg-[#0E341E] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Orchard
          </button>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xs border border-[#15472B]/30 hover:border-[#15472B] hover:bg-[#15472B]/5 text-[#15472B] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            Explore Harvests
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;

import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export const showConfirm = async (title: string, text: string) => {
  return MySwal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#D53F8C', // var(--color-pink)
    cancelButtonColor: '#718096', // text-slate-500
    confirmButtonText: 'Yes, proceed!',
    cancelButtonText: 'Cancel',
    customClass: {
      popup: 'rounded-xl border border-border bg-white',
      title: 'text-2xl font-bold text-[#2D3748]',
      htmlContainer: 'text-muted-foreground',
      confirmButton: 'rounded-lg px-6 py-2 font-semibold text-white shadow-md transition-all hover:opacity-90',
      cancelButton: 'rounded-lg px-6 py-2 font-semibold text-white shadow-md transition-all hover:bg-[#A0AEC0]',
    },
  });
};

export const showSuccess = (title: string, text: string) => {
  return MySwal.fire({
    title,
    text,
    icon: 'success',
    confirmButtonColor: '#D53F8C',
    customClass: {
      popup: 'rounded-xl border border-border bg-white',
      confirmButton: 'rounded-lg px-6 py-2 font-semibold text-white shadow-md',
    },
  });
};

export const showError = (title: string, text: string) => {
  return MySwal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonColor: '#E53E3E', // text-destructive
    customClass: {
      popup: 'rounded-xl border border-border bg-white',
      confirmButton: 'rounded-lg px-6 py-2 font-semibold text-white shadow-md',
    },
  });
};

export default MySwal;


/**
 * Componente Container para limitar a largura máxima do conteúdo
 * @param {Object} props - Propriedades do componente
 * @param {React.ReactNode} props.children - Conteúdo a ser renderizado dentro do container
 * @param {string} props.className - Classes adicionais para o container
 */
export default function Container({ children, className = "" }) {
    return (
        <div className={`max-w-4xl mx-auto px-3 ${className}`}>
            {children}
        </div>
    );
}
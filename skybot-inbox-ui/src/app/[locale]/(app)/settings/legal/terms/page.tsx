export default function TermsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Términos y Condiciones</h2>
        <p className="text-sm text-muted-foreground">
          Última actualización: 27 de enero de 2026
        </p>
      </div>

      <div className="prose prose-sm max-w-none">
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">1. Aceptación de los Términos</h3>
          <p className="text-muted-foreground">
            Al acceder y utilizar esta plataforma, usted acepta estar sujeto a estos Términos y Condiciones de uso, todas las leyes y regulaciones aplicables, y acepta que es responsable del cumplimiento de todas las leyes locales aplicables.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">2. Uso de la Licencia</h3>
          <p className="text-muted-foreground">
            Se otorga permiso para utilizar temporalmente esta plataforma para uso personal y comercial, sujeto a las restricciones establecidas en estos términos.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">3. Limitaciones</h3>
          <p className="text-muted-foreground">
            No está permitido:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Modificar o copiar los materiales</li>
            <li>Usar los materiales para cualquier propósito comercial no autorizado</li>
            <li>Intentar descompilar o realizar ingeniería inversa del software</li>
            <li>Eliminar cualquier derecho de autor u otras notaciones de propiedad</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">4. Privacidad</h3>
          <p className="text-muted-foreground">
            Su privacidad es importante para nosotros. Consulte nuestra Política de Privacidad para obtener información sobre cómo recopilamos, usamos y protegemos sus datos personales.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">5. Modificaciones</h3>
          <p className="text-muted-foreground">
            Nos reservamos el derecho de revisar estos términos de servicio en cualquier momento sin previo aviso. Al usar esta plataforma, usted acepta estar sujeto a la versión actual de estos términos y condiciones.
          </p>
        </section>
      </div>
    </div>
  );
}

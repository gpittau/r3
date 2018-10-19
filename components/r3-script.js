<html>
  <script>
  (function ({currentScript:{ownerDocument}}) {
    class r3Script extends HTMLScriptElement {
      constructor () {
        super();
      }
      connectedCallback () {
        const src = this.getAttribute("src");
        const srcAttr = (src && await(await fetch(src)).text()));
        const srcLoc = (!srcAttr && sessionStorage[location.hash])
        const srcTxt = (!srcLoc && this.innerText);
        sessionStorage.src = srcAttr || srcLoc || srcTxt;
        Run();
      }
    }
    customElements.define('r3-script', r3Script, {extends: "script"});
  })(document);

  </script>
</html>


